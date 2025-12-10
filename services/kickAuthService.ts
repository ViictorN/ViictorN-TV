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
  
  // Configuration based on Kick Developer Docs
  const KICK_AUTH_URL = "https://id.kick.com/oauth/authorize";
  const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
  const KICK_API_URL = "https://api.kick.com/public/v1";
  
  // Scopes extracted from your screenshot:
  // user:read, channel:read, chat:write, events:subscribe, etc.
  const SCOPES = "user:read channel:read chat:write events:subscribe";
  
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
  
  /**
   * Initiates the Official PKCE Flow.
   * Redirects the user to Kick's login page.
   */
  export const initiateKickLogin = async (clientId: string, redirectUri: string) => {
    // 1. Generate PKCE Verifier (High entropy random string)
    const codeVerifier = generateRandomString(128);
    
    // 2. Save verifier to LocalStorage to verify later upon callback (Critical for security)
    localStorage.setItem("kick_code_verifier", codeVerifier);
    
    // 3. Generate Code Challenge (SHA-256 hash of the verifier)
    const codeChallenge = await generateCodeChallenge(codeVerifier);
  
    // 4. Construct the Authorization URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });
  
    console.log(`[Kick Auth] Redirecting to: ${KICK_AUTH_URL}?${params.toString()}`);
    
    // 5. Redirect User
    window.location.href = `${KICK_AUTH_URL}?${params.toString()}`;
  };
  
  /**
   * Handles the Callback from Kick.
   * Exchanges the Authorization Code for an Access Token.
   */
  export const handleKickCallback = async (code: string, clientId: string, redirectUri: string): Promise<KickTokenResponse> => {
    const codeVerifier = localStorage.getItem("kick_code_verifier");
    
    if (!codeVerifier) {
      throw new Error("PKCE Code Verifier not found. The flow was interrupted or local storage was cleared.");
    }
  
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      code: code
    });
  
    // NOTE: Kick's Token Endpoint enforces CORS. 
    // Since we are a client-side app (SPA) without a dedicated backend server,
    // we must use a CORS Proxy to complete the token exchange.
    const proxy = "https://corsproxy.io/?";
    
    console.log("[Kick Auth] Exchanging code for token...");

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
            console.error("[Kick Auth] Token Exchange Failed:", errText);
            throw new Error(`Kick API Error (${response.status}): ${errText}`);
        }
    
        const data = await response.json();
        
        // Security Cleanup
        localStorage.removeItem("kick_code_verifier");
        
        console.log("[Kick Auth] Success!");
        return data;

    } catch (error: any) {
        console.error("Kick Login Error:", error);
        throw new Error("Falha na troca de token. Verifique se o Client ID e a Redirect URI estão exatos na Dashboard da Kick.");
    }
  };
  
  export const fetchKickUserProfile = async (accessToken: string): Promise<KickUserProfile | null> => {
      try {
          // Public API requests also often need proxy from browser
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
          } else {
              console.warn("[Kick API] Profile fetch failed", await res.text());
          }
      } catch (e) {
          console.error("Failed to fetch Kick user profile", e);
      }
      return null;
  };
