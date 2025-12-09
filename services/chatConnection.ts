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
        } else if (line.includes('USERNOTICE')) {
          this.parseUserNotice(line);
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

  private parseUserNotice(raw: string) {
      // Handle Subs, Resubs, Gifts
      let tags: Record<string, string> = {};
      let remaining = raw;
      
      if (raw.startsWith('@')) {
        const endIdx = raw.indexOf(' ');
        const rawTags = raw.substring(1, endIdx);
        remaining = raw.substring(endIdx + 1);
        rawTags.split(';').forEach(t => {
          const [key, val] = t.split('=');
          tags[key] = val; 
        });
      }

      // Check if it is a sub/resub
      const msgId = tags['msg-id'];
      if (msgId === 'sub' || msgId === 'resub' || msgId === 'subgift' || msgId === 'announcement') {
          
          let systemMsg = tags['system-msg'] || 'Subscription Event';
          systemMsg = systemMsg.replace(/\\s/g, ' '); // Unescape spaces

          // Extract optional user message if exists
          let userMessage = '';
          const channelEnd = remaining.indexOf(' :', remaining.indexOf('USERNOTICE'));
          if (channelEnd !== -1) {
              userMessage = remaining.substring(channelEnd + 2).trim();
          }

          const username = tags['display-name'] || tags['login'] || 'Twitch';
          const color = tags['color'];
          const subMonths = tags['msg-param-cumulative-months'] ? parseInt(tags['msg-param-cumulative-months']) : 1;

           // Parse Badges
            const badges: Badge[] = [];
            if (tags['badges']) {
            tags['badges'].split(',').forEach(pair => {
                const [type, version] = pair.split('/');
                badges.push({ type, version });
            });
            }

          const msg: ChatMessage = {
              id: tags['id'] || crypto.randomUUID(),
              platform: Platform.TWITCH,
              user: { username, color, badges },
              content: userMessage ? `${systemMsg}: ${userMessage}` : systemMsg,
              timestamp: Number(tags['tmi-sent-ts']) || Date.now(),
              isSubscription: true,
              subMonths
          };
          this.onMessage(msg);
      }
  }

  private parseMessage(raw: string) {
    let tags: Record<string, string> = {};
    let remaining = raw;
    
    if (raw.startsWith('@')) {
      const endIdx = raw.indexOf(' ');
      const rawTags = raw.substring(1, endIdx);
      remaining = raw.substring(endIdx + 1);
      
      rawTags.split(';').forEach(t => {
        const [key, val] = t.split('=');
        tags[key] = val;
      });
    }

    const privMsgIdx = remaining.indexOf('PRIVMSG');
    if (privMsgIdx === -1) return;

    const channelEnd = remaining.indexOf(' :', privMsgIdx);
    if (channelEnd === -1) return;

    const content = remaining.substring(channelEnd + 2).trim();
    const username = tags['display-name'] || 'Unknown';
    const color = tags['color'];
    
    const badges: Badge[] = [];
    if (tags['badges']) {
      tags['badges'].split(',').forEach(pair => {
        const [type, version] = pair.split('/');
        badges.push({ type, version });
      });
    }

    let replyTo: ReplyInfo | undefined = undefined;
    if (tags['reply-parent-msg-id']) {
        replyTo = {
            id: tags['reply-parent-msg-id'],
            username: tags['reply-parent-display-name'] || 'User',
            content: tags['reply-parent-msg-body']?.replace(/\\s/g, ' ') || '...' 
        };
    }

    let emotes: Record<string, string[]> | undefined = undefined;
    if (tags['emotes']) {
      emotes = {};
      tags['emotes'].split('/').forEach(emoteGroup => {
        const [id, positions] = emoteGroup.split(':');
        emotes![id] = positions.split(',');
      });
    }

    // NATIVE TWITCH FIRST MESSAGE
    const isFirstMessage = tags['first-msg'] === '1';

    const msg: ChatMessage = {
      id: tags['id'] || crypto.randomUUID(),
      platform: Platform.TWITCH,
      user: { username, color, badges },
      content,
      timestamp: Number(tags['tmi-sent-ts']) || Date.now(),
      emotes,
      replyTo,
      isFirstMessage // Set based on native tag
    };

    this.onMessage(msg);
  }
}

// --- KICK IMPLEMENTATION ---
export class KickConnection {
  private ws: WebSocket | null = null;
  private channelSlug: string;
  private onMessage: MessageCallback;
  private onDelete: DeleteCallback;
  private chatroomId: number | null = null;
  private channelId: number | null = null; // Needed for sub events
  private pingInterval: number | null = null;
  private accessToken: string | null = null;

  private readonly PUSHER_KEY = '32cbd69e4b950bf97679';
  private readonly PUSHER_CLUSTER = 'us2';

  constructor(channelSlug: string, onMessage: MessageCallback, onDelete: DeleteCallback, accessToken?: string) {
    this.channelSlug = channelSlug;
    this.onMessage = onMessage;
    this.onDelete = onDelete;
    this.accessToken = accessToken || null;
  }

  async connect() {
    // 1. HARDCODED OPTIMIZATION (Bypass API blocks for known channel)
    if (this.channelSlug.toLowerCase() === 'gabepeixe') {
        console.log('[Kick] Using optimized connection for Gabepeixe');
        this.chatroomId = 9766487;
        this.channelId = 9766487;
        this.connectWs();
        this.fetchHistory().catch(e => console.warn("[Kick] History fetch skipped", e));
        return;
    }

    try {
      let data = null;
      try {
        const res = await fetch(`https://corsproxy.io/?https://kick.com/api/v1/channels/${this.channelSlug}`);
        if (res.ok) {
            data = await res.json();
            console.log('[Kick] Metadata retrieved via Internal API');
        }
      } catch (e) { console.warn("[Kick] Internal API failed, trying fallback...", e); }

      if (!data) {
         try {
            const res = await fetch(`https://corsproxy.io/?https://api.kick.com/public/v1/channels/${this.channelSlug}`);
            if (res.ok) {
                data = await res.json();
                console.log('[Kick] Metadata retrieved via Public API');
            }
         } catch (e) { console.warn("[Kick] Public API failed", e); }
      }

      if (data) {
        if (data.chatroom) this.chatroomId = data.chatroom.id;
        if (data.id) this.channelId = data.id;

        this.connectWs();
        this.fetchHistory().catch(e => console.warn("[Kick] History fetch failed, but realtime should work.", e));
      } else {
          console.error('[Kick] Could not find channel metadata. Chat will not connect.');
      }
    } catch (e) {
      console.error('[Kick] Connect Fatal Error:', e);
    }
  }

  private async fetchHistory() {
      if (!this.chatroomId) return;
      try {
          const res = await fetch(`https://corsproxy.io/?https://api.kick.com/public/v1/chatrooms/${this.chatroomId}/messages`);
          if (res.ok) {
              const json = await res.json();
              if (json.data && Array.isArray(json.data)) {
                  const history = json.data.reverse();
                  history.forEach((msgData: any) => this.processMessage(msgData));
              }
          }
      } catch (e) {}
  }

  private connectWs() {
    if (!this.chatroomId) return;

    this.ws = new WebSocket(`wss://ws-${this.PUSHER_CLUSTER}.pusher.com/app/${this.PUSHER_KEY}?protocol=7&client=js&version=8.4.0-rc2&flash=false`);

    this.ws.onopen = () => {
      console.log('[Kick] WS Connected');
      
      // Subscribe to Chatroom
      this.ws?.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: { auth: '', channel: `chatrooms.${this.chatroomId}.v2` }
      }));

      // Subscribe to Channel Events (for Subs) if channelId is known
      if (this.channelId) {
          this.ws?.send(JSON.stringify({
            event: 'pusher:subscribe',
            data: { auth: '', channel: `channel.${this.channelId}` }
          }));
      }
      
      this.pingInterval = window.setInterval(() => {
          // Keep alive
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        // Chat Message
        if (payload.event === 'App\\Events\\ChatMessageEvent') {
           const data = JSON.parse(payload.data);
           this.processMessage(data);
        }
        // Deletion
        else if (payload.event === 'App\\Events\\MessageDeletedEvent') {
            const data = JSON.parse(payload.data);
            if (data && data.message && data.message.id) {
                this.onDelete(data.message.id);
            }
        }
        // Subscriptions
        else if (payload.event === 'App\\Events\\SubscriptionEvent') {
            const data = JSON.parse(payload.data);
            const username = data.username || 'Someone';
            const months = data.months || 1;
            this.onMessage({
                id: crypto.randomUUID(),
                platform: Platform.KICK,
                user: { username, badges: [], color: '#53FC18' },
                content: `${username} se inscreveu! (${months} meses)`,
                timestamp: Date.now(),
                isSubscription: true,
                subMonths: months
            });
        }
         // Gifted Subs
        else if (payload.event === 'App\\Events\\GiftedSubscriptionsEvent') {
            const data = JSON.parse(payload.data);
            const gifter = data.gifter_username || 'Anonymous';
            const count = data.gifted_usernames?.length || 1;
             this.onMessage({
                id: crypto.randomUUID(),
                platform: Platform.KICK,
                user: { username: gifter, badges: [], color: '#53FC18' },
                content: `${gifter} presenteou ${count} inscrições!`,
                timestamp: Date.now(),
                isSubscription: true
            });
        }

      } catch (e) {}
    };

    this.ws.onclose = () => {
      if (this.pingInterval) clearInterval(this.pingInterval);
    };
  }

  private processMessage(data: any) {
    const badges: Badge[] = [];
    if (data.sender && data.sender.identity && data.sender.identity.badges) {
        data.sender.identity.badges.forEach((b: any) => {
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
      replyTo,
      isFirstMessage: false // Kick API does not support native First Message tag in current public events
    };
    
    this.onMessage(msg);
  }

  async sendMessage(content: string) {
      if (!this.chatroomId || !this.accessToken) {
          throw new Error("Missing Chatroom ID or Access Token");
      }

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
          throw new Error(`Kick API Error`);
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