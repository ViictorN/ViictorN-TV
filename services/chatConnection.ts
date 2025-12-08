import { ChatMessage, Platform, Badge } from "../types";

type MessageCallback = (msg: ChatMessage) => void;

// --- TWITCH IMPLEMENTATION ---
export class TwitchConnection {
  private ws: WebSocket | null = null;
  private channel: string;
  private onMessage: MessageCallback;
  private pingInterval: number | null = null;

  constructor(channel: string, onMessage: MessageCallback) {
    this.channel = channel.toLowerCase();
    this.onMessage = onMessage;
  }

  connect() {
    this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    this.ws.onopen = () => {
      console.log('[Twitch] Connected');
      this.ws?.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      this.ws?.send('PASS SCHMOOPIIE');
      this.ws?.send(`NICK justinfan${Math.floor(Math.random() * 100000)}`);
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
        }
      });
    };

    this.ws.onclose = () => {
      if (this.pingInterval) clearInterval(this.pingInterval);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pingInterval) clearInterval(this.pingInterval);
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
        tags[key] = val;
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
      emotes
    };

    this.onMessage(msg);
  }
}

// --- KICK IMPLEMENTATION ---
export class KickConnection {
  private ws: WebSocket | null = null;
  private channelSlug: string;
  private onMessage: MessageCallback;
  private chatroomId: number | null = null;

  constructor(channelSlug: string, onMessage: MessageCallback) {
    this.channelSlug = channelSlug;
    this.onMessage = onMessage;
  }

  async connect() {
    try {
      const response = await fetch(`https://corsproxy.io/?https://kick.com/api/v1/channels/${this.channelSlug}`);
      const data = await response.json();
      
      if (data && data.chatroom && data.chatroom.id) {
        this.chatroomId = data.chatroom.id;
        this.connectToPusher();
      }
    } catch (e) {
      console.error('[Kick] Connect Error:', e);
    }
  }

  private connectToPusher() {
    if (!this.chatroomId) return;

    this.ws = new WebSocket('wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false');

    this.ws.onopen = () => {
      const subscribePayload = {
        event: 'pusher:subscribe',
        data: { auth: '', channel: `chatrooms.${this.chatroomId}.v2` }
      };
      this.ws?.send(JSON.stringify(subscribePayload));
    };

    this.ws.onmessage = (event) => {
      const payload = JSON.parse(event.data as string);
      
      if (payload.event === 'App\\Events\\ChatMessageEvent') {
        const data = JSON.parse(payload.data);
        
        // Parse Kick Badges
        const badges: Badge[] = [];
        if (data.sender && data.sender.identity && data.sender.identity.badges) {
            data.sender.identity.badges.forEach((b: any) => {
                badges.push({ type: b.type, version: '1' });
            });
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
          timestamp: new Date(data.created_at).getTime()
          // Kick native emotes parsing is complex without a dictionary API, 
          // usually 3rd party tools (7TV) handle this overlay.
        };
        
        this.onMessage(msg);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}