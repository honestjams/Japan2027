import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — copy .env.example to .env.local",
  );
}

// There's no login: the app is a shared notebook for two people, and the
// database's RLS policies allow the publishable key to read and edit plans.
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
