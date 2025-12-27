import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing');
  if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
    console.error('⚠️ WARNING: API key format looks incorrect. Supabase anon keys should start with "eyJ..." (JWT token)');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

