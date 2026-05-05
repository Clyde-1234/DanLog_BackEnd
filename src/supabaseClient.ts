import dotenv from 'dotenv';
import { SupabaseClientSingleton } from './patterns/SupabaseClientSingleton';

if (!process.env.CI) {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("--- Supabase Diagnostics ---");
  console.error("URL Found:", !!supabaseUrl);
  console.error("Key Found:", !!supabaseKey);
  console.error("CI Env Active:", !!process.env.CI);
  console.error("NODE_ENV:", process.env.NODE_ENV);
  console.error("---------------------------");
  throw new Error('Supabase URL and Key are required to initialize the client.');
}

export const supabase = SupabaseClientSingleton.getInstance({
  url: supabaseUrl,
  key: supabaseKey,
});