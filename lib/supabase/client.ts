import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
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
  });
}
