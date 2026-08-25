import { createClient1 } from '@supabase/supabase-js';

// Access the environment variables automatically provided by the Netlify extension
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient1(supabaseUrl, supabaseAnonKey);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Connected to Supabase PostgreSQL');
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
  }
}

testConnection();

module.exports = { supabase };