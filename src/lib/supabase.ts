import { createClient } from '@supabase/supabase-js';

// Public anon key only. Row Level Security in supabase/migrations enforces access.
// Never put the service-role key in this app.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
