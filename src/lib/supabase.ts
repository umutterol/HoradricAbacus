import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Create client only if credentials are configured
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : null;

export const isSupabaseConfigured = (): boolean => supabase !== null;

// Log warning in development if not configured
if (!supabase && import.meta.env.DEV) {
  console.warn(
    'Supabase credentials not configured. Collaborative features disabled.\n' +
    'To enable, create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}
