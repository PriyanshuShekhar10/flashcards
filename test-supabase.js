// Quick test script to verify Supabase connection
// Run with: node test-supabase.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key format:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    // Test query to folders table
    const { data, error } = await supabase.from('folders').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.error('\n💡 Solution: You need to run the SQL schema!');
        console.error('1. Go to Supabase Dashboard → SQL Editor');
        console.error('2. Copy and paste the contents of supabase-schema.sql');
        console.error('3. Click Run');
      } else if (error.message.includes('JWT') || error.message.includes('key')) {
        console.error('\n💡 Solution: Your API key format is incorrect!');
        console.error('Get the correct key from: Supabase Dashboard → Settings → API → anon public key');
        console.error('It should be a long JWT token starting with "eyJ..."');
      }
      process.exit(1);
    } else {
      console.log('✅ Connection successful!');
      console.log('Tables exist and are accessible.');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

test();

