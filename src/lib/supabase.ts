import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  detectSessionInUrl: true,
  storageKey: 'zama-auth',
  flowType: 'pkce',
  debug: false,
  storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null;
        try {
          const value = window.localStorage.getItem(key);
          return value;
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // ignore
        }
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.removeItem(key);
        } catch {
          // ignore
        }
      },
    },
  },
});
