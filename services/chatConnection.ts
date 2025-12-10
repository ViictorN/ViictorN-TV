import { ChatMessage, Platform, Badge, ReplyInfo } from "../types";

type MessageCallback = (msg: ChatMessage) => void;
type DeleteCallback = (msgId: string) => void;
type EmoteSetsCallback = (sets: string[]) => void;

// --- TWITCH IMPLEMENTATION ---
export class TwitchConnection {
  private ws: WebSocket | null = null;
  private channel: string;
  private onMessage: MessageCallback;
  private onDelete: DeleteCallback;
  private onEmoteSets?: EmoteSetsCallback;
  private pingInterval: number | null = null;
  private oauth: string | null = null;
  private username: string | null = null;

  constructor(
      channel: string, 
      onMessage: MessageCallback, 
      onDelete: DeleteCallback, 
      oauth?: string, 
      username?: string,
      onEmoteSets?: EmoteSetsCallback
  ) {
    this.channel = channel.toLowerCase();
    this.onMessage = onMessage;
    this.onDelete = onDelete;
    this.onEmoteSets = onEmoteSets;
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
        } else if (line.includes('GLOBALUSERSTATE') || line.includes('USERSTATE')) {
            // Capture User Emote Sets (Subs, Turbo, Prime)
            this.handleUserState(line);
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

  private handleUserState(raw: string) {
      if (!this.onEmoteSets) return;
      
      const tags = this.parseTags(raw);
      if (tags['emote-sets']) {
          const sets = tags['emote-sets'].split(',');
          this.onEmoteSets(sets);
      }
  }

  private handleClearMsg(raw: string) {
      const tags = this.parseTags(raw);
      if (tags['target-msg-id']) {
          this.onDelete(tags['target-msg-id']);
      }
  }

  private parseTags(raw: string): Record<string, string> {
      const tags: Record<string, string> = {};
      if (raw.startsWith('@')) {
        const endIdx = raw.indexOf(' ');
        const rawTags = raw.substring(1, endIdx);
        rawTags.split(';').forEach(t => {
          const [key, val] = t.split('=');
          tags[key] = val; 
        });
      }
      return tags;
  }

  private parseUserNotice(raw: string) {
      const tags = this.parseTags(raw);
      const msgId = tags['msg-id'];
      
      // ... (Existing UserNotice logic retained but simplified using helper)
      let remaining = raw.substring(raw.indexOf(' ') + 1);

      if (msgId === 'sub' || msgId === 'resub' || msgId === 'subgift' || msgId === 'announcement') {
          
          let systemMsg = tags['system-msg'] || 'Subscription Event';
          systemMsg = systemMsg.replace(/\\s/g, ' '); 

          const subMonths = tags['msg-param-cumulative-months'] ? parseInt(tags['msg-param-cumulative-months']) : 1;
          
          if (msgId === 'sub') {
              systemMsg = 'Se inscreveu no canal!';
          } else if (msgId === 'resub') {
              systemMsg = `Re-inscreveu por ${subMonths} meses!`;
          } else if (msgId === 'subgift') {
              const recipient = tags['msg-param-recipient-display-name'] || tags['msg-param-recipient-user-name'] || 'alguém';
              systemMsg = `Presenteou uma inscrição para ${recipient}!`;
          }

          let userMessage = '';
          const channelEnd = remaining.indexOf(' :', remaining.indexOf('USERNOTICE'));
          if (channelEnd !== -1) {
              userMessage = remaining.substring(channelEnd + 2).trim();
          }

          const username = tags['display-name'] || tags['login'] || 'Twitch';
          const userId = tags['user-id'];
          const color = tags['color'];
          
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
              user: { username, color, badges, id: userId },
              content: userMessage ? `${systemMsg}: ${userMessage}` : systemMsg,
              timestamp: Number(tags['tmi-sent-ts']) || Date.now(),
              isSubscription: true,
              subMonths
          };
          this.onMessage(msg);
      }
  }

  private parseMessage(raw: string) {
    const tags = this.parseTags(raw);
    let remaining = raw.substring(raw.indexOf(' ') + 1);

    const privMsgIdx = remaining.indexOf('PRIVMSG');
    if (privMsgIdx === -1) return;

    const channelEnd = remaining.indexOf(' :', privMsgIdx);
    if (channelEnd === -1) return;

    const content = remaining.substring(channelEnd + 2).trim();
    const username = tags['display-name'] || 'Unknown';
    const userId = tags['user-id'];
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

    const isFirstMessage = tags['first-msg'] === '1';

    const msg: ChatMessage = {
      id: tags['id'] || crypto.randomUUID(),
      platform: Platform.TWITCH,
      user: { username, color, badges, id: userId },
      content,
      timestamp: Number(tags['tmi-sent-ts']) || Date.now(),
      emotes,
      replyTo,
      isFirstMessage
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
  private channelId: number | null = null; 
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

  // Robust Fetcher with Fallbacks
  private async fetchWithFallbacks(url: string): Promise<any> {
      // 1. Try CORS Proxy IO
      try {
          const res = await fetch(`https://corsproxy.io/?${url}`);
          if (res.ok) return await res.json();
      } catch (e) { console.warn(`[Kick] Proxy 1 failed for ${url}`, e); }

      // 2. Try AllOrigins
      try {
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
          if (res.ok) return await res.json();
      } catch (e) { console.warn(`[Kick] Proxy 2 failed for ${url}`, e); }

      // 3. Try Direct (Will fail if CORS not enabled, but worth a shot for some endpoints)
      try {
          const res = await fetch(url);
          if (res.ok) return await res.json();
      } catch (e) { console.warn(`[Kick] Direct fetch failed for ${url}`, e); }

      return null;
  }

  async connect() {
    console.log(`[Kick] Connecting to ${this.channelSlug}...`);
    
    // Step 1: Get Channel Data (need chatroom_id)
    const channelData = await this.fetchWithFallbacks(`https://kick.com/api/v1/channels/${this.channelSlug}`);
    
    if (!channelData) {
        console.error('[Kick] Failed to retrieve channel metadata. Connection aborted.');
        // If we can't get metadata, we can't connect to WS.
        return;
    }

    if (channelData.chatroom) {
        this.chatroomId = channelData.chatroom.id;
        console.log(`[Kick] Found Chatroom ID: ${this.chatroomId}`);
    }

    if (channelData.id) {
        this.channelId = channelData.id;
    }

    if (this.chatroomId) {
        this.connectWs();
        this.fetchHistory();
    } else {
        console.error('[Kick] Chatroom ID not found in metadata.');
    }
  }

  private async fetchHistory() {
      if (!this.chatroomId) return;
      
      console.log('[Kick] Fetching history...');
      const endpoint = `https://api.kick.com/public/v1/chatrooms/${this.chatroomId}/messages`;
      
      // Use fallback fetcher for history too
      const data = await this.fetchWithFallbacks(endpoint);

      if (data && data.data && Array.isArray(data.data)) {
          const history = data.data.reverse();
          history.forEach((msgData: any) => this.processMessage(msgData));
          console.log(`[Kick] Loaded ${history.length} messages.`);
      } else {
          console.warn('[Kick] Failed to load history.');
      }
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
          if (this.ws?.readyState === WebSocket.OPEN) {
             // Basic keep-alive if needed, but Pusher usually handles pings via protocol
             // Just keeping the interval to match structure
          }
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
                user: { username, badges: [], color: '#53FC18', id: data.user_id },
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
    if (!data || !data.sender) return;

    const badges: Badge[] = [];
    if (data.sender.identity && data.sender.identity.badges) {
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

    // Ensure we handle missing profile pics gracefully
    let profilePic = data.sender.profile_pic;
    // Kick sometimes sends a string "null" or actual null. 
    // If null, construct standard URL from ID.
    if (!profilePic || profilePic === 'null') {
        if (data.sender.id) {
            profilePic = `https://files.kick.com/images/user_profile_pics/${data.sender.id}/image.webp`;
        }
    }
    const isValidAvatar = profilePic && !profilePic.includes('null');

    const msg: ChatMessage = {
      id: data.id,
      platform: Platform.KICK,
      user: {
        username: data.sender.username,
        color: data.sender.identity?.color || '#53FC18',
        badges: badges,
        avatarUrl: isValidAvatar ? profilePic : undefined,
        id: String(data.sender.id)
      },
      content: data.content,
      timestamp: new Date(data.created_at).getTime(),
      replyTo,
      isFirstMessage: false 
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