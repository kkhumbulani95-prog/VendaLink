require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_SECRET_KEY is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;