import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabaseAdresi, supabaseAnonAnahtari } from "@/lib/env";

/** Oturumdaki kullanıcı adına çalışan istemci: RLS kuralları bu kullanıcıya göre uygulanır. */
export async function supabaseSunucu() {
  const cerezler = await cookies();
  return createServerClient<Database>(supabaseAdresi(), supabaseAnonAnahtari(), {
    cookies: {
      getAll: () => cerezler.getAll(),
      setAll: (yeni) => {
        try {
          for (const { name, value, options } of yeni) cerezler.set(name, value, options);
        } catch {
          // Sunucu bileşeninden çağrıldıysa çerez yazılamaz; oturumu proxy.ts yeniler.
        }
      },
    },
  });
}
