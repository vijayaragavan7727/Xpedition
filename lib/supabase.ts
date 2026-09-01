import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: {
          getItem: (key) => (typeof window !== 'undefined' ? sessionStorage.getItem(key) : null),
          setItem: (key, value) => {
            if (typeof window !== 'undefined') sessionStorage.setItem(key, value);
          },
          removeItem: (key) => {
            if (typeof window !== 'undefined') sessionStorage.removeItem(key);
          },
        },
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
