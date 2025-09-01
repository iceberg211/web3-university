import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL as string | undefined;
const key = process.env.SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  console.warn(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Set them in web/.env.local (see web/.env.local.example)."
  );
}

export const supabase = createClient(url ?? "", key ?? "");

export default supabase;
