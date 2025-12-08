import { EmoteMap } from "../types";

const SEVENTV_API_BASE = 'https://7tv.io/v3';

// IDs do Gabepeixe (Hardcoded para performance, mas poderiam ser buscados)
// Twitch ID do Gabepeixe: 45593883
// Kick ID do Gabepeixe: 9766487
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

export const fetch7TVEmotes = async (): Promise<EmoteMap> => {
  const emoteMap: EmoteMap = {};

  try {
    // 1. Fetch Global Emotes
    const globalRes = await fetch(`${SEVENTV_API_BASE}/emote-sets/global`);
    if (globalRes.ok) {
        const data = await globalRes.json();
        processEmoteSet(data.emotes, emoteMap);
    }

    // 2. Fetch Channel Emotes (Twitch Connection)
    const twitchRes = await fetch(`${SEVENTV_API_BASE}/users/twitch/${GABE_TWITCH_ID}`);
    if (twitchRes.ok) {
        const data = await twitchRes.json();
        if (data.emote_set?.emotes) {
            processEmoteSet(data.emote_set.emotes, emoteMap);
        }
    }

    // 3. Fetch Channel Emotes (Kick Connection)
    // Nota: A API v3 do 7TV unifica usuários, mas as vezes o set da Kick é separado.
    // Vamos tentar buscar pelo ID user da kick se o da twitch não cobriu tudo.
    const kickRes = await fetch(`${SEVENTV_API_BASE}/users/kick/${GABE_KICK_ID}`);
    if (kickRes.ok) {
        const data = await kickRes.json();
        if (data.emote_set?.emotes) {
            processEmoteSet(data.emote_set.emotes, emoteMap);
        }
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