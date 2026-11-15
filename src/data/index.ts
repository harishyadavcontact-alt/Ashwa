import { supabase } from '../lib/supabase';
import { LocalStore } from './localStore';
import { SupabaseStore } from './supabaseStore';
import type { AppStore } from './store';

// Supabase when configured, otherwise the local demo store. The UI never checks which one it has.
export const store: AppStore = supabase ? new SupabaseStore() : new LocalStore();
export const isDemoMode = !supabase;
