import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

export const SUPABASE_URL = 'https://gqxrbpqrmnflmecuqryp.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJicHFybW5mbG1lY3VxcnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzEzNzAsImV4cCI6MjA3NTI0NzM3MH0.DerdcHMv_JVoG6M75_hOrh64oui51ItgaOstRaayWbs'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
