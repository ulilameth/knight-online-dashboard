// Ayarlar › Eşya kataloğu: elle eklenen eşyaya görsel yükleme. Dosya Supabase Storage'daki herkese açık
// "esya-gorselleri" kovasına gider (supabase/migrations/0002_esya_gorselleri.sql), items.gorsel adresini tutar.
// Saf fonksiyonlar; yükleme lib/data/items.ts'te.

export const GORSEL_KOVASI = "esya-gorselleri";
/** Kovanın file_size_limit'iyle aynı; eşya simgesi küçük bir resim */
export const MAX_GORSEL_BAYT = 256 * 1024;

export type GorselTuru = "png" | "jpeg" | "webp" | "gif";
export const GORSEL_MIME: Record<GorselTuru, string> = {
  png: "image/png", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
};
const UZANTI: Record<GorselTuru, string> = { png: "png", jpeg: "jpg", webp: "webp", gif: "gif" };

const basliyor = (b: Uint8Array, imza: number[], kayma = 0) => imza.every((x, i) => b[kayma + i] === x);

/** Türü dosya adından ya da tarayıcının bildirdiğinden değil, ilk baytlardan anlar (SVG ve diğerleri kabul edilmez) */
export function gorselTuru(b: Uint8Array): GorselTuru | null {
  if (basliyor(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (basliyor(b, [0xff, 0xd8, 0xff])) return "jpeg";
  if (basliyor(b, [0x52, 0x49, 0x46, 0x46]) && basliyor(b, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  if (basliyor(b, [0x47, 0x49, 0x46, 0x38])) return "gif";
  return null;
}

/** Yüklenecek dosyayı denetler; geçerliyse türü, değilse Türkçe hata */
export function gorselDenetle(b: Uint8Array): { tur: GorselTuru } | { hata: string } {
  if (!b.length) return { hata: "Dosya boş" };
  if (b.length > MAX_GORSEL_BAYT) return { hata: `Görsel en fazla ${MAX_GORSEL_BAYT / 1024} KB olabilir` };
  const tur = gorselTuru(b);
  return tur ? { tur } : { hata: "Görsel PNG, JPEG, WebP ya da GIF olmalı" };
}

/** Kovadaki yol: eşya başına klasör, her yüklemede yeni ad (tarayıcı önbelleği eski görseli göstermesin) */
export function gorselYolu(esyaId: number, tur: GorselTuru, zaman = Date.now()): string {
  return `${esyaId}/${zaman.toString(36)}.${UZANTI[tur]}`;
}

/**
 * items.gorsel bu kovadaki bir dosyanın herkese açık adresiyse kovadaki yolu; değilse (KO Bugda dosya adı, başka adres) null.
 * onek: kovanın herkese açık adresi, "/" ile biter (getPublicUrl("")).
 */
export function kovaYolu(gorsel: string | null, onek: string): string | null {
  return gorsel?.startsWith(onek) ? decodeURIComponent(gorsel.slice(onek.length)) : null;
}
