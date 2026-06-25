import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

// Server-only client using service_role key.
// NEVER import this in client components or expose via NEXT_PUBLIC_.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
