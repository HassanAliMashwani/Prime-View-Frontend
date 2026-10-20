import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nnuyccntmxhrkbbsnmwn.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udXljY250bXhocmtiYnNubXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODc2MDUsImV4cCI6MjEwNDg2MzYwNX0.ZRmNpcfGviAD_L9vM___VKBEcBEyvdxHL-eVkXQ7uK8';

  if (!url || !anonKey) {
    return null;
  }

  supabaseInstance = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
    },
  });

  return supabaseInstance;
}
