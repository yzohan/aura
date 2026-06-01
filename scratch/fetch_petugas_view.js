import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching v_user_roles_detail...");
  const { data, error } = await supabase
    .from("v_user_roles_detail")
    .select("*");

  if (error) {
    console.error("View Error:", error);
  } else {
    console.log("View Data:", data);
  }
}

run();
