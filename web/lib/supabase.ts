import { createClient } from "@supabase/supabase-js";

const url = "https://hmwqozapbrxruqkqfdgu.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtd3FvemFwYnJ4cnVxa3FmZGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzMzMzQsImV4cCI6MjA3MjMwOTMzNH0.01VOSd5KRqI5k8rLsY2ayeBTF8nYzQiOyMaRBf3B28A";

if (!url || !key) {
  console.warn(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Set them in web/.env.local (see web/.env.local.example)."
  );
}

export const supabase = createClient(url ?? "", key ?? "");

export default supabase;
