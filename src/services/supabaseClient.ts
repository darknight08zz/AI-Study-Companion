
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;


export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
    console.error("Supabase is not configured. Missing VITE_SUPABASE_URL or SUPABASE_ANON_KEY.");
}


const url = isConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const key = isConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url, key);
