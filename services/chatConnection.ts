import { ChatMessage, Platform, Badge, ReplyInfo } from "../types";

type MessageCallback = (msg: ChatMessage) => void;
type DeleteCallback = (msgId: string) => void;

// --- TWITCH IMPLEMENTATION ---
export class TwitchConnection {
  private ws: WebSocket | null = null;
  private channel: string;
  private onMessage: MessageCallback;
  private onDelete: DeleteCallback;
  private pingInterval: number | null = null;
  private oauth: string | null = null;
  private username: string | null = null;

  constructor(channel: string, onMessage: MessageCallback, onDelete: DeleteCallback, oauth?: string, username?: string) {
    this.channel = channel.toLowerCase();
    this.onMessage = onMessage;
    this.onDelete = onDelete;
    this.oauth = oauth || null;
    this.username = username || 'justinfan' + Math.floor(Math.random() * 100000);
  }

  connect() {
    this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    this.ws.onopen = () => {
      console.log('[Twitch] Connected');
      this.ws?.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      
      if (this.oauth) {
          this.ws?.send(`PASS oauth:${this.oauth}`);
          this.ws?.send(`NICK ${this.username}`);
      } else {
          this.ws?.send('PASS SCHMOOPIIE');
          this.ws?.send(`NICK ${this.username}`);
      }
      
      this.ws?.send(`JOIN #${this.channel}`);
      
      this.pingInterval = window.setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('PING');
        }
      }, 60000);
    };

    this.ws.onmessage = (event) => {
      const data = event.data as string;
      const lines = data.split('\r\n'); // Handle multiple lines in one packet

      lines.forEach(line => {
        if (!line) return;
        
        if (line.startsWith('PING')) {
          this.ws?.send('PONG');
          return;
        }

        if (line.includes('PRIVMSG')) {
          this.parseMessage(line);
        } else if (line.includes('CLEARMSG')) {
          this.handleClearMsg(line);
        }
      });
    };

    this.ws.onclose = () => {
      if (this.pingInterval) clearInterval(this.pingInterval);
    };
  }

  sendMessage(content: string) {
      if (this.ws?.readyState === WebSocket.OPEN && this.oauth) {
          this.ws.send(`PRIVMSG #${this.channel} :${content}`);
      } else {
          console.warn('[Twitch] Cannot send message: Not connected or no OAuth');
      }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  private handleClearMsg(raw: string) {
      // @login=...;target-msg-id=UUID ... CLEARMSG ...
      const tagsStart = raw.indexOf('@');
      if (tagsStart === -1) return;
      
      const tagsEnd = raw.indexOf(' ');
      const tagsStr = raw.substring(tagsStart + 1, tagsEnd);
      
      const tags: Record<string, string> = {};
      tagsStr.split(';').forEach(t => {
          const [key, val] = t.split('=');
          tags[key] = val;
      });

      if (tags['target-msg-id']) {
          this.onDelete(tags['target-msg-id']);
      }
  }

  private parseMessage(raw: string) {
    // Robust IRC v3 Parser
    
    let tags: Record<string, string> = {};
    let remaining = raw;
    
    // 1. Extract Tags
    if (raw.startsWith('@')) {
      const endIdx = raw.indexOf(' ');
      const rawTags = raw.substring(1, endIdx);
      remaining = raw.substring(endIdx + 1);
      
      rawTags.split(';').forEach(t => {
        const [key, val] = t.split('=');
        tags[key] = val; // Note: values might be escaped
      });
    }

    // 2. Find PRIVMSG
    const privMsgIdx = remaining.indexOf('PRIVMSG');
    if (privMsgIdx === -1) return;

    // 3. Extract Content
    const channelEnd = remaining.indexOf(' :', privMsgIdx);
    if (channelEnd === -1) return;

    const content = remaining.substring(channelEnd + 2).trim();

    // 4. Process Metadata
    const username = tags['display-name'] || 'Unknown';
    const color = tags['color'];
    
    // Parse Badges
    const badges: Badge[] = [];
    if (tags['badges']) {
      tags['badges'].split(',').forEach(pair => {
        const [type, version] = pair.split('/');
        badges.push({ type, version });
      });
    }

    // Parse Reply Info
    let replyTo: ReplyInfo | undefined = undefined;
    if (tags['reply-parent-msg-id']) {
        replyTo = {
            id: tags['reply-parent-msg-id'],
            username: tags['reply-parent-display-name'] || 'User',
            content: tags['reply-parent-msg-body']?.replace(/\\s/g, ' ') || '...' // Unescape spaces
        };
    }

    // Parse Emotes
    // format: emotes=25:0-4,12-16/1902:6-10
    let emotes: Record<string, string[]> | undefined = undefined;
    if (tags['emotes']) {
      emotes = {};
      tags['emotes'].split('/').forEach(emoteGroup => {
        const [id, positions] = emoteGroup.split(':');
        emotes![id] = positions.split(',');
      });
    }

    const msg: ChatMessage = {
      id: tags['id'] || crypto.randomUUID(),
      platform: Platform.TWITCH,
      user: { username, color, badges },
      content,
      timestamp: Number(tags['tmi-sent-ts']) || Date.now(),
      emotes,
      replyTo
    };

    this.onMessage(msg);
  }
}

// --- KICK IMPLEMENTATION (Pusher WebSocket + API Write) ---
export class KickConnection {
  private ws: WebSocket | null = null;
  private channelSlug: string;
  private onMessage: MessageCallback;
  private onDelete: DeleteCallback;
  private chatroomId: number | null = null;
  private pingInterval: number | null = null;
  private accessToken: string | null = null;

  // Kick Pusher Public Key & Cluster
  private readonly PUSHER_KEY = '32cbd69e4b950bf97679';
  private readonly PUSHER_CLUSTER = 'us2';

  constructor(channelSlug: string, onMessage: MessageCallback, onDelete: DeleteCallback, accessToken?: string) {
    this.channelSlug = channelSlug;
    this.onMessage = onMessage;
    this.onDelete = onDelete;
    this.accessToken = accessToken || null;
  }

  async connect() {
    try {
      // 1. Get Chatroom ID
      const response = await fetch(`https://corsproxy.io/?https://kick.com/api/v1/channels/${this.channelSlug}`);
      const data = await response.json();
      
      if (data && data.chatroom && data.chatroom.id) {
        this.chatroomId = data.chatroom.id;
        this.connectWs();
      } else {
          console.warn('[Kick] Could not find chatroom ID for', this.channelSlug);
      }
    } catch (e) {
      console.error('[Kick] Connect Error (Metadata):', e);
    }
  }

  private connectWs() {
    if (!this.chatroomId) return;

    // Connect to Kick's Pusher Instance
    this.ws = new WebSocket(`wss://ws-${this.PUSHER_CLUSTER}.pusher.com/app/${this.PUSHER_KEY}?protocol=7&client=js&version=8.4.0-rc2&flash=false`);

    this.ws.onopen = () => {
      console.log('[Kick] WS Connected');
      
      const subscribePayload = {
        event: 'pusher:subscribe',
        data: {
          auth: '',
          channel: `chatrooms.${this.chatroomId}.v2`
        }
      };
      this.ws?.send(JSON.stringify(subscribePayload));
      
      this.pingInterval = window.setInterval(() => {
          // Standard WS keep-alive if needed
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.event === 'App\\Events\\ChatMessageEvent') {
           const data = JSON.parse(payload.data);
           this.processMessage(data);
        }
        else if (payload.event === 'App\\Events\\MessageDeletedEvent') {
            const data = JSON.parse(payload.data);
            if (data && data.message && data.message.id) {
                this.onDelete(data.message.id);
            }
        }
      } catch (e) {
          // Ignore parsing errors
      }
    };

    this.ws.onclose = () => {
      console.log('[Kick] WS Closed');
      if (this.pingInterval) clearInterval(this.pingInterval);
    };
  }

  private processMessage(data: any) {
    const badges: Badge[] = [];
    if (data.sender && data.sender.identity && data.sender.identity.badges) {
        data.sender.identity.badges.forEach((b: any) => {
            // Kick sends 'count' for subscriber months, map this to version
            badges.push({ type: b.type, version: b.count ? String(b.count) : '1' });
        });
    }

    let replyTo: ReplyInfo | undefined = undefined;
    if (data.reply_to) {
        replyTo = {
            id: data.reply_to.id,
            username: data.reply_to.sender?.username || 'User',
            content: data.reply_to.content || '...'
        };
    }

    const msg: ChatMessage = {
      id: data.id,
      platform: Platform.KICK,
      user: {
        username: data.sender.username,
        color: data.sender.identity?.color || '#53FC18',
        badges: badges
      },
      content: data.content,
      timestamp: new Date(data.created_at).getTime(),
      replyTo
    };
    
    this.onMessage(msg);
  }

  // SEND MESSAGE IMPLEMENTATION
  async sendMessage(content: string) {
      if (!this.chatroomId || !this.accessToken) {
          throw new Error("Missing Chatroom ID or Access Token");
      }

      // We use corsproxy to attempt to bypass browser CORS checks, 
      // but Cloudflare may still block these requests.
      const endpoint = `https://corsproxy.io/?https://api.kick.com/public/v1/chatrooms/${this.chatroomId}/messages`;

      const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({ 
              content: content, 
              type: 'message' 
          })
      });

      if (!res.ok) {
          let errorMsg = 'Unknown Error';
          try {
              const errData = await res.json();
              errorMsg = errData.message || JSON.stringify(errData);
          } catch {
              errorMsg = await res.text();
          }
          throw new Error(`Kick API Error: ${errorMsg}`);
      }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
    }
  }
}