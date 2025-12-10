import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SavedMessage, UserNote } from '../types';

// Environment variables - Support both Create-React-App and Vite patterns
// On Vercel + Vite, it uses import.meta.env.VITE_...
// On Vercel + CRA, it uses process.env.REACT_APP_...
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[Backend] Supabase Client Initialized');
  } catch (e) {
    console.warn('[Backend] Failed to initialize Supabase client:', e);
  }
} else {
    // This often renders in local dev if env vars aren't set, but in Vercel they should be present.
    console.log('[Backend] Supabase credentials not found. App running in Offline mode (Local Storage only).');
}

export const isBackendConfigured = (): boolean => {
    return !!supabase;
};

// --- AUTH METHODS ---

export const signInWithTwitch = async () => {
    if (!supabase) throw new Error("Backend não configurado.");
    
    // Explicitly use window.location.origin to ensure redirects work on whatever domain this is running (Vercel or Localhost)
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

// REMOVED BROKEN EDGE FUNCTION CALL
export const exchangeKickToken = async (code: string, codeVerifier: string, redirectUri: string) => {
    throw new Error("Use client-side exchange instead.");
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

// --- DATA SYNC METHODS (PROFILE) ---

export const getUserProfile = async (userId: string) => {
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
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

export const updateUserProfile = async (userId: string, data: { settings?: any, twitch_creds?: any, kick_creds?: any }) => {
    if (!supabase) return;
    
    const payload: any = { id: userId, updated_at: new Date().toISOString() };
    if (data.settings) payload.settings = data.settings;
    if (data.twitch_creds) payload.twitch_creds = data.twitch_creds;
    if (data.kick_creds) payload.kick_creds = data.kick_creds;

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) console.error('[Supabase] Save Error', error);
};

// --- NEW FEATURES: BOOKMARKS & NOTES ---

export const saveMessage = async (msg: { platform: string, author: string, content: string, timestamp: number, avatar_url?: string }) => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('saved_messages').insert({
        user_id: user.id,
        platform: msg.platform,
        author: msg.author,
        content: msg.content,
        timestamp: msg.timestamp,
        avatar_url: msg.avatar_url
    }).select().single();

    if (error) throw error;
    return data;
};

export const getSavedMessages = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('saved_messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as SavedMessage[];
};

export const deleteSavedMessage = async (id: string) => {
    if (!supabase) return;
    await supabase.from('saved_messages').delete().eq('id', id);
};

// Notes
export const saveUserNote = async (targetUsername: string, targetPlatform: string, note: string) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('user_notes').upsert({
        user_id: user.id,
        target_username: targetUsername,
        target_platform: targetPlatform,
        note: note,
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, target_username, target_platform' });

    if (error) console.error('Error saving note', error);
};

export const getUserNote = async (targetUsername: string, targetPlatform: string): Promise<string> => {
    if (!supabase) return '';
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return '';

    const { data } = await supabase.from('user_notes')
        .select('note')
        .eq('user_id', user.id)
        .eq('target_username', targetUsername)
        .eq('target_platform', targetPlatform)
        .single();
    
    return data?.note || '';
};