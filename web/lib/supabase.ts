import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL as string | undefined;
const key = process.env.SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  // Soft warning; API routes/components should handle runtime errors gracefully
  console.warn("Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars");
}

export const supabase = createClient(url ?? "", key ?? "");

export default supabase;

