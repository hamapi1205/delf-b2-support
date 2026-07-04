import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service Role クライアント(RLSをバイパスする)。
// API Route のサーバー側処理専用。クライアントに公開してはならない。
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY が設定されていません");
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}
