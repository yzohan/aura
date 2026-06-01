import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Querying work_orders...");
  const { data, error } = await supabase
    .from('work_orders')
    .select('*');

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Work Orders:", data);
  }
}

run();
