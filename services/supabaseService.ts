import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (Vite uses import.meta.env, Create React App uses process.env)
// Falling back to provided hardcoded keys for immediate functionality.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ewlrbudjojzgrzdmfexa.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bHJidWRqb2p6Z3J6ZG1mZXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODU5OTcsImV4cCI6MjA4MDk2MTk5N30.joBk-QkP84XMx8o2mDIpI6lR3wQaeZrZQcGHhqWyg7U';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[Backend] Supabase Client Initialized');
  } catch (e) {
    console.warn('[Backend] Failed to initialize Supabase client:', e);
  }
} else {
    console.log('[Backend] Supabase credentials not found. App running in Local/Offline mode.');
}

export const isBackendConfigured = (): boolean => {
    return !!supabase;
};

// --- AUTH METHODS ---

export const signInWithTwitch = async () => {
    if (!supabase) throw new Error("Backend não configurado.");
    
    // Scopes needed for chat reading/writing
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitch',
        options: {
            scopes: 'chat:read chat:edit user:read:email',
            redirectTo: window.location.origin
        }
    });
    
    if (error) throw error;
    return data;
};

// Kick currently doesn't have a direct Supabase Auth provider built-in as easily as Twitch,
// usually requiring a custom OAuth flow or OpenID Connect. 
// This is a placeholder for when that integration exists or via custom Edge Function.
export const signInWithKick = async () => {
    if (!supabase) throw new Error("Backend não configurado.");
    // Placeholder: In a real scenario, this might redirect to a custom backend endpoint
    alert("Login social da Kick via Supabase requer configuração avançada de provedor customizado.");
};

export const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
};

export const getSession = async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
};

export const getClient = () => supabase;

// --- DATA SYNC METHODS ---

// Fetch user profile (settings, saved keys)
export const getUserProfile = async (userId: string) => {
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            // It's common to not have a profile yet if it's the first login
            if (error.code !== 'PGRST116') {
                console.warn('[Supabase] Fetch Profile Error', error);
            }
            return null;
        }
        return data;
    } catch (e) {
        console.error('[Supabase] Unexpected error fetching profile', e);
        return null;
    }
};

// Save user profile (Upsert)
export const updateUserProfile = async (userId: string, data: { settings?: any, twitch_creds?: any, kick_creds?: any }) => {
    if (!supabase) return;
    
    // Prepare payload, removing undefined
    const payload: any = { id: userId, updated_at: new Date().toISOString() };
    if (data.settings) payload.settings = data.settings;
    if (data.twitch_creds) payload.twitch_creds = data.twitch_creds;
    if (data.kick_creds) payload.kick_creds = data.kick_creds;

    const { error } = await supabase
        .from('profiles')
        .upsert(payload);
        
    if (error) console.error('[Supabase] Save Error', error);
};