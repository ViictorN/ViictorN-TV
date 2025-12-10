// PKCE Utils
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
    
    // Convert ArrayBuffer to Base64URL string
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/\//g, "_") // Duplicate safety
      .replace(/=+$/, "");
  }
  
  // Service Config
  const KICK_AUTH_URL = "https://id.kick.com/oauth/authorize";
  const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
  const KICK_API_URL = "https://api.kick.com/public/v1";
  
  // Scopes needed for chat and reading user info
  const SCOPES = "user:read channel:read chat:write";
  
  export interface KickTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }
  
  export interface KickUserProfile {
    id: number;
    username: string;
    profile_pic?: string;
  }
  
  export const initiateKickLogin = async (clientId: string, redirectUri: string) => {
    // 1. Generate PKCE Verifier
    const codeVerifier = generateRandomString(128);
    
    // 2. Save verifier to verify later upon callback
    localStorage.setItem("kick_code_verifier", codeVerifier);
    
    // 3. Generate Challenge
    const codeChallenge = await generateCodeChallenge(codeVerifier);
  
    // 4. Construct URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });
  
    // 5. Redirect User
    window.location.href = `${KICK_AUTH_URL}?${params.toString()}`;
  };
  
  export const handleKickCallback = async (code: string, clientId: string, redirectUri: string): Promise<KickTokenResponse> => {
    const codeVerifier = localStorage.getItem("kick_code_verifier");
    
    if (!codeVerifier) {
      throw new Error("PKCE Code Verifier not found. Please try logging in again.");
    }
  
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      code: code
    });
  
    // Note: We use corsproxy because requesting token from browser usually triggers CORS on Kick's ID server
    // If the app has a backend, this request should ideally be done there.
    const proxy = "https://corsproxy.io/?";
    
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
            throw new Error(`Kick API Error (${response.status}): ${errText}`);
        }
    
        const data = await response.json();
        
        // Cleanup
        localStorage.removeItem("kick_code_verifier");
        
        return data;

    } catch (error: any) {
        console.error("Kick Login Error:", error);
        throw new Error("Falha na troca de token. A API da Kick pode estar bloqueando proxys. Tente o método manual.");
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
          console.error("Failed to fetch Kick user profile", e);
      }
      // Return minimal info if fetch fails (common with manual tokens that work for chat but not API reading)
      return { id: 0, username: 'Usuário Kick' }; 
  };
