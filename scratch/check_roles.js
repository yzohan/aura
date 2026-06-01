import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: roles } = await supabase.from('user_roles').select('*');

  console.log('PROFILES:');
  console.log(profiles);
  console.log('ROLES:');
  console.log(roles);
}

run();
