import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 1. Load environment variables
dotenv.config(); 

// 2. Extract values with fallbacks
// If you are using the _TEST suffix in .env.test, these will catch them.
// If your .env.test uses standard names, Jest's override handles it.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// 3. Robust Error Logging
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase Config Error:");
  console.error("URL Found:", !!supabaseUrl);
  console.error("Key Found:", !!supabaseKey);
  console.error("Current NODE_ENV:", process.env.NODE_ENV);
  throw new Error('Supabase URL and Key are required to initialize the client.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);