// Ortam değişkenleri tek yerden okunur. Gizli olanlar (service role, kayıt imzası) yalnızca sunucuda kullanılır.

export type VeriKaynagi = "demo" | "supabase";

export function veriKaynagi(): VeriKaynagi {
  return process.env.DATA_SOURCE === "supabase" ? "supabase" : "demo";
}

function gerekli(ad: string): string {
  const deger = process.env[ad];
  if (!deger) throw new Error(`${ad} ortam değişkeni eksik (DATA_SOURCE=supabase için gerekli; bkz. README)`);
  return deger;
}

export const supabaseAdresi = () => gerekli("NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonAnahtari = () => gerekli("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const supabaseServisAnahtari = () => gerekli("SUPABASE_SERVICE_ROLE_KEY");

/** Kayıt adımları arasındaki davet çerezini imzalar. Demo modunda sabit bir değer yeterli. */
export function kayitImzaAnahtari(): string {
  const deger = process.env.KAYIT_IMZA_ANAHTARI;
  if (deger) return deger;
  if (veriKaynagi() === "demo") return "demo-imza-anahtari";
  throw new Error("KAYIT_IMZA_ANAHTARI ortam değişkeni eksik (en az 32 karakter rastgele metin)");
}
