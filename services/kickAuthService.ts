// CLIENT ID FIXO (Do seu Painel de Desenvolvedor Kick)
export const KICK_CLIENT_ID = "01KC09QDGSZ5VKZQED4QJ05KJ8";

// PKCE Utils for OAuth 2.0 Security
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
    
    // Convert ArrayBuffer to Base64URL string compliant with RFC 7636
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  
  // Endpoints
  const KICK_AUTH_URL = "https://id.kick.com/oauth/authorize";
  const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
  const KICK_API_URL = "https://api.kick.com/public/v1";
  
  // Scopes based on your screenshot
  const SCOPES = "user:read channel:read chat:write events:subscribe";
  
  /**
   * 1. INICIAR LOGIN: Redireciona o usuário para a Kick
   * Agora usa o ID fixo, sem pedir nada ao usuário.
   */
  export const initiateKickLogin = async () => {
    // A Redirect URI deve ser a origem atual + barra
    // IMPORTANTE: Certifique-se que https://viictor-n-tv.vercel.app/ (e localhost se usar) estão no painel.
    const redirectUri = window.location.origin + '/';

    // Gerar PKCE Verifier
    const codeVerifier = generateRandomString(128);
    
    // Salvar no LocalStorage para validar na volta (Segurança)
    localStorage.setItem("kick_code_verifier", codeVerifier);
    
    // Gerar Code Challenge
    const codeChallenge = await generateCodeChallenge(codeVerifier);
  
    // Construir URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: KICK_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });
  
    console.log(`[Kick Auth] Iniciando fluxo automático para Client ID: ${KICK_CLIENT_ID}`);
    
    // Redirecionar
    window.location.href = `${KICK_AUTH_URL}?${params.toString()}`;
  };
  
  /**
   * 2. PROCESSAR RETORNO: Troca o código pelo token
   */
  export const handleKickCallback = async (code: string): Promise<KickTokenResponse> => {
    const redirectUri = window.location.origin + '/';
    const codeVerifier = localStorage.getItem("kick_code_verifier");
    
    if (!codeVerifier) {
      throw new Error("PKCE Code Verifier não encontrado. O processo de login foi interrompido.");
    }
  
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: KICK_CLIENT_ID,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      code: code
    });
  
    // IMPORTANTE: A API de Token da Kick tem bloqueio de CORS para navegadores.
    // Usamos um proxy (corsproxy.io) para contornar isso em ambiente puramente frontend.
    const proxy = "https://corsproxy.io/?";
    
    console.log("[Kick Auth] Trocando código por token...");

    try {
        const response = await fetch(`${proxy}${KICK_TOKEN_URL}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: params
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("[Kick Auth] Erro na troca:", errText);
            throw new Error(`Erro API Kick (${response.status}): ${errText}`);
        }
    
        const data = await response.json();
        
        // Limpeza de segurança
        localStorage.removeItem("kick_code_verifier");
        
        return data;

    } catch (error: any) {
        console.error("Kick Login Error:", error);
        throw new Error("Falha ao trocar o código pelo token. Verifique se a URL atual está autorizada no Painel da Kick.");
    }
  };
  
  export const fetchKickUserProfile = async (accessToken: string): Promise<KickUserProfile | null> => {
      try {
          const proxy = "https://corsproxy.io/?";
          const res = await fetch(`${proxy}${KICK_API_URL}/users`, {
              headers: {
                  "Authorization": `Bearer ${accessToken}`
              }
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
