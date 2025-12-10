// CLIENT ID FIXO (Público e Seguro com PKCE)
export const KICK_CLIENT_ID = "01KC09QDGSZ5VKZQED4QJ05KJ8";

// Scopes necessários (conforme seu print)
const SCOPES = "user:read channel:read chat:write events:subscribe";

// Endpoints
const KICK_AUTH_URL = "https://id.kick.com/oauth/authorize";
const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
const KICK_API_URL = "https://api.kick.com/public/v1";

// Utils PKCE
function generateRandomString(length: number) {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
  
async function generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
}

// 1. INICIAR LOGIN
export const initiateKickLogin = async () => {
    // Detecta URL atual e garante a barra no final
    let redirectUri = window.location.origin;
    if (!redirectUri.endsWith('/')) redirectUri += '/';

    const codeVerifier = generateRandomString(128);
    localStorage.setItem("kick_code_verifier", codeVerifier);
    
    const codeChallenge = await generateCodeChallenge(codeVerifier);
  
    const params = new URLSearchParams({
      response_type: "code",
      client_id: KICK_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });
  
    console.log(`[Kick Auth] Iniciando fluxo para: ${redirectUri}`);
    window.location.href = `${KICK_AUTH_URL}?${params.toString()}`;
};
  
// 2. PROCESSAR TOKEN
export const handleKickCallback = async (code: string): Promise<KickTokenResponse> => {
    let redirectUri = window.location.origin;
    if (!redirectUri.endsWith('/')) redirectUri += '/';

    const codeVerifier = localStorage.getItem("kick_code_verifier");
    if (!codeVerifier) throw new Error("Verificador PKCE perdido. Tente novamente.");
  
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: KICK_CLIENT_ID,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      code: code
    });
  
    // Tenta proxies diferentes para evitar bloqueio de CORS
    // A API de token da Kick bloqueia chamadas diretas do navegador
    const proxies = [
        "https://corsproxy.io/?",
        "https://api.allorigins.win/raw?url="
    ];

    let lastError;

    for (const proxy of proxies) {
        try {
            console.log(`[Kick Auth] Tentando troca de token via ${proxy}...`);
            const response = await fetch(`${proxy}${encodeURIComponent(KICK_TOKEN_URL)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                },
                body: params
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.removeItem("kick_code_verifier");
                return data;
            } else {
                const text = await response.text();
                console.warn(`[Kick Auth] Falha no proxy ${proxy}:`, text);
            }
        } catch (e) {
            lastError = e;
            console.warn(`[Kick Auth] Erro de rede no proxy ${proxy}`, e);
        }
    }

    throw new Error("Falha na conexão com a Kick. Verifique se a URL " + redirectUri + " está no seu Painel de Desenvolvedor.");
};
  
// 3. PEGAR PERFIL
export const fetchKickUserProfile = async (accessToken: string): Promise<KickUserProfile | null> => {
      try {
          const res = await fetch(`https://corsproxy.io/?${KICK_API_URL}/users`, {
              headers: { "Authorization": `Bearer ${accessToken}` }
          });
          
          if (res.ok) {
              const data = await res.json();
              if (data.data) {
                  return {
                      id: data.data.id,
                      username: data.data.username,
                      profile_pic: data.data.profile_pic
                  };
              }
          }
      } catch (e) {
          console.error("Erro ao buscar perfil Kick", e);
      }
      return null;
};

export interface KickTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}
  
export interface KickUserProfile {
    id: number;
    username: string;
    profile_pic?: string;
}
