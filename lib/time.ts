// Tarih ve saat: panel her yerde Türkiye saatiyle (TSİ, UTC+3, yaz saati yok) gösterir.

export const TZ = "Europe/Istanbul";
const GUN_MS = 86_400_000;

/** "2026-11-12T16:00" ya da "2026-11-12" (TSİ) → ISO (UTC) */
export function tsi(yerel: string): string {
  const tam = yerel.length === 10 ? `${yerel}T00:00:00+03:00` : `${yerel}:00+03:00`;
  const t = Date.parse(tam);
  if (Number.isNaN(t)) throw new Error(`Geçersiz tarih: ${yerel}`);
  return new Date(t).toISOString();
}

/**
 * Şimdiki zaman. Demo modunda DEMO_SIMDI (ör. "2026-11-21T19:40") verilirse o andan başlar;
 * açılış sonrası ekranları gerçek tarihi beklemeden görmek için.
 */
const SUREC_BASLANGICI = Date.now();
export function simdi(): Date {
  const demo = process.env.DATA_SOURCE !== "supabase" ? process.env.DEMO_SIMDI : undefined;
  // Demo zamanı sunucu başladığından beri geçen süre kadar ilerler
  return demo ? new Date(Date.parse(tsi(demo)) + (Date.now() - SUREC_BASLANGICI)) : new Date();
}

export function bicimle(iso: string | Date, secenek: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, ...secenek }).format(new Date(iso));
}

/** "21:00" */
export const saatMetni = (iso: string | Date) => bicimle(iso, { hour: "2-digit", minute: "2-digit" });
/** "12 Kasım" */
export const gunMetni = (iso: string | Date) => bicimle(iso, { day: "numeric", month: "long" });
/** "12 Kasım Perşembe, 16:00" */
export const tamMetin = (iso: string | Date) =>
  `${bicimle(iso, { day: "numeric", month: "long", weekday: "long" })}, ${saatMetni(iso)}`;

/** TSİ takvim günü: "2026-11-12" */
export function tsiGunu(iso: string | Date): string {
  return new Date(new Date(iso).getTime() + 3 * 3_600_000).toISOString().slice(0, 10);
}

/** İki an arasındaki TSİ takvim günü farkı (b − a) */
export function gunFarki(a: string | Date, b: string | Date): number {
  return Math.round((Date.parse(tsiGunu(b)) - Date.parse(tsiGunu(a))) / GUN_MS);
}

const goreli = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });

/** "şimdi", "2 saat sonra", "yarın", "3 gün önce", "2 hafta sonra" */
export function goreliZaman(iso: string | Date, su: Date = simdi()): string {
  const fark = new Date(iso).getTime() - su.getTime();
  const gun = gunFarki(su, iso);
  if (gun === 0) {
    const dk = Math.round(fark / 60_000);
    if (Math.abs(dk) < 1) return "şimdi";
    if (Math.abs(dk) < 60) return goreli.format(dk, "minute");
    return goreli.format(Math.round(dk / 60), "hour");
  }
  if (Math.abs(gun) < 14) return goreli.format(gun, "day");
  return goreli.format(Math.round(gun / 7), "week");
}

/** Sunucu açıldı mı (açılış anı dahil) */
export const acildiMi = (acilisAt: string, su: Date = simdi()) => su.getTime() >= Date.parse(acilisAt);

/** Açılışa kalan süre; geçtiyse sıfırlar */
export function kalanSure(hedef: string, su: Date = simdi()) {
  const ms = Math.max(0, Date.parse(hedef) - su.getTime());
  return {
    gun: Math.floor(ms / GUN_MS),
    saat: Math.floor((ms % GUN_MS) / 3_600_000),
    dakika: Math.floor((ms % 3_600_000) / 60_000),
    saniye: Math.floor((ms % 60_000) / 1000),
  };
}

/** Gün bazında: "bugün", "yarın", "dün", "3 gün sonra", "2 gün önce" (listelerde saat ayrıca yazılır) */
export function gunGoreli(iso: string | Date, su: Date = simdi()): string {
  const n = gunFarki(su, iso);
  if (n === 0) return "bugün";
  if (n === 1) return "yarın";
  if (n === -1) return "dün";
  return n > 0 ? `${n} gün sonra` : `${-n} gün önce`;
}

/** TSİ'de haftanın pazartesisi (gün metni, "2026-11-16") */
export function haftaninPazartesisi(su: Date = simdi()): string {
  const gun = tsiGunu(su);
  const hg = new Date(`${gun}T12:00:00Z`).getUTCDay();
  return new Date(Date.parse(`${gun}T12:00:00Z`) - ((hg + 6) % 7) * GUN_MS).toISOString().slice(0, 10);
}
