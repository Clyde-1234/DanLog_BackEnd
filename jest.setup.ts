// jest.setup.ts
import dotenv from 'dotenv';
import path from 'path';

// Force load .env.test and allow it to OVERRIDE existing variables
dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: true });

console.log("🧪 Test Environment Loaded: Using DB", process.env.SUPABASE_URL);