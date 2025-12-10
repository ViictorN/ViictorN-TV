// --- CREDENCIAIS DA KICK (FORNECIDAS PELO USUÁRIO) ---
export const KICK_CLIENT_ID = "01KC09QDGSZ5VKZQED4QJ05KJ8";
export const KICK_CLIENT_SECRET = "acfb15027646927309d8818800d8500bb88af5a81881e4ea667d00b62d7752e7";

// Scopes necessários
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

// 1. INICIAR LOGIN (Browser)
export const initiateKickLogin = async () => {
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
  
    console.log(`[Kick Auth] Iniciando login para: ${redirectUri}`);
    window.location.href = `${KICK_AUTH_URL}?${params.toString()}`;
};
  
// 2. PROCESSAR TOKEN (Direto no Frontend com Proxy)
export const handleKickCallback = async (code: string): Promise<KickTokenResponse> => {
    let redirectUri = window.location.origin;
    if (!redirectUri.endsWith('/')) redirectUri += '/';

    const codeVerifier = localStorage.getItem("kick_code_verifier");
    // Se não tiver verifier, tentamos sem ele (fluxo legado) ou geramos erro
    if (!codeVerifier) console.warn("Verificador PKCE perdido, tentando troca simples...");
  
    console.log("[Kick Auth] Trocando código por token...");

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", KICK_CLIENT_ID);
    params.append("client_secret", KICK_CLIENT_SECRET);
    params.append("redirect_uri", redirectUri);
    params.append("code", code);
    if (codeVerifier) params.append("code_verifier", codeVerifier);

    // Usamos um Proxy CORS porque a API da Kick bloqueia requisições diretas do navegador
    const proxies = [
        "https://corsproxy.io/?",
        "https://api.allorigins.win/raw?url="
    ];

    let lastError;

    for (const proxy of proxies) {
        try {
            const targetUrl = `${proxy}${encodeURIComponent(KICK_TOKEN_URL)}`;
            console.log(`Tentando proxy: ${proxy}`);
            
            const response = await fetch(targetUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                },
                body: params
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Resposta da Kick inválida (não é JSON).");
            }

            if (!response.ok || data.error) {
                console.warn(`[Kick Auth] Erro no proxy ${proxy}:`, data);
                throw new Error(data.error_description || data.error || "Erro desconhecido na troca de token");
            }

            // Sucesso!
            localStorage.removeItem("kick_code_verifier");
            return data;

        } catch (e: any) {
            console.warn(`[Kick Auth] Falha ao conectar via ${proxy}`, e);
            lastError = e;
        }
    }

    throw lastError || new Error("Não foi possível conectar aos servidores de autenticação da Kick.");
};
  
// 3. PEGAR PERFIL
export const fetchKickUserProfile = async (accessToken: string): Promise<KickUserProfile | null> => {
      try {
          const res = await fetch(`https://corsproxy.io/?${KICK_API_URL}/users`, {
              headers: { 
                  "Authorization": `Bearer ${accessToken}`,
                  "Accept": "application/json"
              }
          });
          
          if (res.ok) {
              const data = await res.json();
              const user = data.data || data;
              
              if (user) {
                  return {
                      id: user.id,
                      username: user.username || user.name,
                      profile_pic: user.profile_pic
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