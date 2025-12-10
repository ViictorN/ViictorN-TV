import { EmoteMap } from "../types";

const SEVENTV_API_BASE = 'https://7tv.io/v3';

// IDs do Gabepeixe
const GABE_TWITCH_ID = '45593883'; 
const GABE_KICK_ID = '9766487';

interface SevenTVEmote {
  name: string;
  data: {
    host: {
      url: string;
      files: { name: string; format: string }[];
    }
  }
}

// Helper to fetch with fallback
const robustFetch = async (url: string) => {
    // 1. Try Direct
    try {
        const res = await fetch(url);
        if (res.ok) return await res.json();
    } catch (e) {
        // Ignore and try proxy
    }

    // 2. Try Proxy
    try {
       const resProxy = await fetch(`https://corsproxy.io/?${url}`);
       if (resProxy.ok) return await resProxy.json();
    } catch (e2) {
       console.warn(`7TV Fetch Failed for ${url}`);
       return null;
    }
    return null;
};

export const fetch7TVEmotes = async (): Promise<EmoteMap> => {
  const emoteMap: EmoteMap = {};

  try {
    // 1. Fetch Global Emotes
    const globalData = await robustFetch(`${SEVENTV_API_BASE}/emote-sets/global`);
    if (globalData && globalData.emotes) {
        processEmoteSet(globalData.emotes, emoteMap);
    }

    // 2. Fetch Channel Emotes (Twitch Connection)
    const twitchData = await robustFetch(`${SEVENTV_API_BASE}/users/twitch/${GABE_TWITCH_ID}`);
    if (twitchData && twitchData.emote_set?.emotes) {
        processEmoteSet(twitchData.emote_set.emotes, emoteMap);
    }

    // 3. Fetch Channel Emotes (Kick Connection)
    const kickData = await robustFetch(`${SEVENTV_API_BASE}/users/kick/${GABE_KICK_ID}`);
    if (kickData && kickData.emote_set?.emotes) {
        processEmoteSet(kickData.emote_set.emotes, emoteMap);
    }

  } catch (e) {
    console.error("Erro ao carregar 7TV:", e);
  }

  return emoteMap;
};

const processEmoteSet = (emotes: SevenTVEmote[], map: EmoteMap) => {
    if (!emotes) return;
    emotes.forEach(emote => {
        // Construct URL: host + filename (prefer webp, size 1x or 2x)
        const host = emote.data.host.url;
        // 7TV files usually have names like "1x.webp", "2x.webp", "3x.webp", "4x.webp"
        // We prefer 2x for retina/high DPI text, or 1x for standard
        map[emote.name] = `https:${host}/2x.webp`;
    });
};