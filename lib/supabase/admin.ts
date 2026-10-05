import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseAdresi, supabaseServisAnahtari } from "@/lib/env";

/**
 * Service role istemcisi: RLS'i aşar. Yalnızca kayıt, giriş ve şifre sıfırlama gibi sunucu işlemlerinde,
 * kullanıcı girdisi doğrulandıktan sonra kullanılır. Tarayıcıya hiçbir zaman gitmez.
 */
export function supabaseAdmin() {
  return createClient<Database>(supabaseAdresi(), supabaseServisAnahtari(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
