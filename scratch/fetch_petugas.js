import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching user_roles for role = petugas...");
  const { data: roleRows, error: roleErr } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "petugas");

  if (roleErr) {
    console.error("Role Error:", roleErr);
    return;
  }
  console.log("Role Rows:", roleRows);

  const ids = (roleRows ?? []).map((r) => r.user_id);
  console.log("IDs:", ids);

  if (ids.length) {
    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    
    if (profErr) {
      console.error("Profile Error:", profErr);
      return;
    }
    console.log("Petugas Profiles:", profs);
  } else {
    console.log("No user IDs with role = petugas");
  }
}

run();
