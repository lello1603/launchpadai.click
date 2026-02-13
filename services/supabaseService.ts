
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, SynthesisMemory } from '../types';

const SUPABASE_URL = 'https://fiviwjynxfhfepwflkdx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdml3anlueGZoZmVwd2Zsa2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDE0NTEsImV4cCI6MjA4NjExNzQ1MX0.PGviKNfaPQ8mLq8HHt9Y1WlCttt3bLU4N1NpuX4Ad6I';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const getURL = () => {
  let url = window?.location?.origin || 'https://launchpadai.click';
  return url.endsWith('/') ? url : `${url}/`;
};

export const auth = {
  signUp: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: { emailRedirectTo: getURL() }
    });
  },
  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    return await supabase.auth.signInWithPassword({ email, password });
  },
  signOut: async () => {
    if (supabase) await supabase.auth.signOut();
  },
  onAuthStateChange: (callback: (session: any) => void) => {
    if (!supabase) return () => {};
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => subscription.unsubscribe();
  }
};

export const syncUserProfile = async (userId: string, profileData: any) => {
  if (!supabase || !userId) return;
  const payload = {
    id: userId,
    email: profileData.email,
    generation_count: profileData.generationCount ?? 0,
    is_subscribed: profileData.isSubscribed ?? false,
    subscription_expiry: profileData.subscriptionExpiry,
    last_generation_date: profileData.lastGenerationDate,
    updated_at: new Date().toISOString()
  };
  await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
};

export const fetchUserProfile = async (userId: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return {
    ...data,
    email: data.email,
    generationCount: data.generation_count ?? 0,
    isSubscribed: data.is_subscribed ?? false,
    subscriptionExpiry: data.subscription_expiry,
    lastGenerationDate: data.last_generation_date
  };
};

export const saveProject = async (userId: string, name: string, prompt: string, code: string, existingId?: string) => {
  if (!supabase) return null;
  
  const payload: any = {
    user_id: userId,
    name,
    prompt,
    code,
    updated_at: new Date().toISOString()
  };

  if (existingId) {
    const { data, error } = await supabase.from('projects').update(payload).eq('id', existingId).select().single();
    if (error) return null;
    return data as Project;
  } else {
    payload.created_at = new Date().toISOString();
    const { data, error } = await supabase.from('projects').insert(payload).select().single();
    if (error) return null;
    return data as Project;
  }
};

export const fetchUserProjects = async (userId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) {
    console.error("Fetch projects error:", error);
    return [];
  }
  return (data as Project[]) || [];
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) {
    console.error("Supabase Delete Error:", error.message);
    return false;
  }
  return true;
};

export const logRepair = async (memory: SynthesisMemory) => {
  if (!supabase) return;
  await supabase.from('synthesis_memory').insert({
    ...memory,
    created_at: new Date().toISOString()
  });
};

export const fetchMemoryMap = async (): Promise<string> => {
  if (!supabase) return "";
  const { data, error } = await supabase
    .from('synthesis_memory')
    .select('error_pattern, solution_logic')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error || !data || data.length === 0) return "";
  return data.map(m => `KNOWN ERROR PATTERN: ${m.error_pattern}\nREQUIRED SOLUTION LOGIC: ${m.solution_logic}`).join('\n\n');
};

export const fetchGlobalEmpireCount = async (): Promise<number> => {
  const BASELINE = 425; 
  if (!supabase) return BASELINE; 
  try {
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    return (count || 0) + BASELINE;
  } catch (err) {
    return BASELINE;
  }
};

export const fetchLatestShouts = async (limit: number = 10) => {
  if (!supabase) return [{ phrase: "Manifest your empire...", author: "@ML0NL1" }];
  const { data } = await supabase.from('shouts').select('*').order('created_at', { ascending: false }).limit(limit);
  return data || [];
};

export const postShout = async (phrase: string, author: string = 'Builder') => {
  if (supabase) await supabase.from('shouts').insert({ phrase, author, created_at: new Date().toISOString() });
};

export const adminTools = {
  fetchAllProfiles: async () => {
    if (!supabase) return [];
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return data || [];
  },
  resetUserCredits: async (userId: string) => {
    if (!supabase) return;
    await supabase.from('profiles').update({ generation_count: 0 }).eq('id', userId);
  },
  deleteUser: async (userId: string) => {
    if (!supabase) return;
    await supabase.from('profiles').delete().eq('id', userId);
  },
  clearJunkProjects: async () => {
    if (!supabase) return;
    await supabase.from('projects').delete().eq('name', 'LaunchPad Mobile Pro');
  }
};
