// Ekranların ortak hesapları (saf fonksiyonlar): yoklama sayımları, tür bazında katılım, sınıf dağılımı, aşamalar.
// Katılım oranı = (katıldı + geç) / işaretlenmiş yoklama; mazeretli oranı düşürür ama ayrı gösterilir.
import { bicimle, gunFarki, gunMetni, saatMetni } from "@/lib/time";
import type { Asama, Etkinlik, EtkinlikTuru, Karakter, Sinif, Yoklama, YoklamaDurumu } from "@/lib/types";

export type Sayim = Record<YoklamaDurumu | "isaretsiz", number>;

/** Bir etkinliğin yoklama sayımı; karakterler verilirse işaretlenmemişler de sayılır */
export function sayim(yoklamalar: Yoklama[], eventId: string, karakterler?: Karakter[]): Sayim {
  const s: Sayim = { katildi: 0, gec: 0, mazeretli: 0, yok: 0, isaretsiz: 0 };
  const bu = yoklamalar.filter((y) => y.eventId === eventId);
  for (const y of bu) s[y.durum]++;
  if (karakterler) s.isaretsiz = Math.max(0, karakterler.length - bu.length);
  return s;
}

/** Yoklama alınan, başlamış etkinlikler (en eski önce) */
export function gecmisEtkinlikler(etkinlikler: Etkinlik[], turler: EtkinlikTuru[], su: Date) {
  const yoklamali = new Set(turler.filter((t) => t.yoklamaVar).map((t) => t.kod));
  return etkinlikler
    .filter((e) => yoklamali.has(e.tur) && Date.parse(e.baslangic) <= su.getTime())
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic));
}

export interface TurSatiri {
  tur: EtkinlikTuru;
  etkinlik: number;
  gelen: number;
  isaretli: number;
  yuzde: number;
}

/** Etkinlik türüne göre katılım (toplantı hariç savaş türleri; toplantı dahil etmek için turKodlari ver) */
export function turKatilimi(gecmis: Etkinlik[], yoklamalar: Yoklama[], turler: EtkinlikTuru[], turKodlari?: string[]): TurSatiri[] {
  const secili = turler.filter((t) => (turKodlari ? turKodlari.includes(t.kod) : t.yoklamaVar && t.kod !== "toplanti"));
  return secili.map((tur) => {
    const ids = new Set(gecmis.filter((e) => e.tur === tur.kod).map((e) => e.id));
    const bu = yoklamalar.filter((y) => ids.has(y.eventId));
    const gelen = bu.filter((y) => y.durum === "katildi" || y.durum === "gec").length;
    return { tur, etkinlik: ids.size, gelen, isaretli: bu.length, yuzde: bu.length ? Math.round((gelen / bu.length) * 100) : 0 };
  });
}

/** Belirli etkinliklerdeki genel katılım */
export function toplamKatilim(etkinlikIds: string[], yoklamalar: Yoklama[]) {
  const ids = new Set(etkinlikIds);
  const bu = yoklamalar.filter((y) => ids.has(y.eventId));
  const gelen = bu.filter((y) => y.durum === "katildi" || y.durum === "gec").length;
  return { gelen, isaretli: bu.length, yuzde: bu.length ? Math.round((gelen / bu.length) * 100) : null };
}

/** Üye başına katılım (yalnızca verilen etkinlikler) */
export function uyeKatilimi(etkinlikIds: string[], yoklamalar: Yoklama[], characterId: string) {
  const ids = new Set(etkinlikIds);
  const bu = yoklamalar.filter((y) => y.characterId === characterId && ids.has(y.eventId));
  if (!bu.length) return null;
  const gelen = bu.filter((y) => y.durum === "katildi" || y.durum === "gec").length;
  return { yuzde: Math.round((gelen / bu.length) * 100), gelen, toplam: bu.length, mazeretli: bu.filter((y) => y.durum === "mazeretli").length };
}

/** En istikrarlı üyeler: oran, eşitlikte daha çok katılım */
export function enIstikrarli(karakterler: Karakter[], etkinlikIds: string[], yoklamalar: Yoklama[], adet = 5) {
  return karakterler
    .map((k) => ({ k, oran: uyeKatilimi(etkinlikIds, yoklamalar, k.id) }))
    .filter((x): x is { k: Karakter; oran: NonNullable<ReturnType<typeof uyeKatilimi>> } => x.oran !== null)
    .sort((a, b) => b.oran.yuzde - a.oran.yuzde || b.oran.gelen - a.oran.gelen || a.k.ad.localeCompare(b.k.ad, "tr"))
    .slice(0, adet);
}

export const SINIF_SIRASI: readonly Sinif[] = ["warrior", "rogue", "mage", "priest", "kurian"];

export function sinifDagilimi(karakterler: Karakter[]) {
  return SINIF_SIRASI.map((s) => ({ sinif: s, adet: karakterler.filter((k) => k.sinif === s).length }));
}

export type AsamaDurumu = "bitti" | "simdi" | "gelecek";

/** Aşamanın durumu: bitiş yoksa (açılış gibi) başladıktan 1 gün sonra biter */
export function asamaDurumu(a: Asama, su: Date): AsamaDurumu {
  const bas = Date.parse(a.baslangic);
  const bit = a.bitis ? Date.parse(a.bitis) : bas + 86_400_000;
  if (su.getTime() >= bit) return "bitti";
  return su.getTime() >= bas ? "simdi" : "gelecek";
}

/** "15 – 29 Ekim", "29 Ekim – 9 Kasım", "12 Kasım, 16:00". Gece yarısı biten aşamanın son günü önceki gündür. */
export function asamaTarihi(a: Asama): string {
  if (a.saatBelli && !a.bitis) return `${gunMetni(a.baslangic)}, ${saatMetni(a.baslangic)}`;
  if (!a.bitis) return gunMetni(a.baslangic);
  const son = new Date(Date.parse(a.bitis) - 60_000);
  const ayniAy = bicimle(a.baslangic, { month: "long" }) === bicimle(son, { month: "long" });
  if (gunFarki(a.baslangic, son) <= 0) return gunMetni(a.baslangic);
  return ayniAy ? `${bicimle(a.baslangic, { day: "numeric" })} – ${gunMetni(son)}` : `${gunMetni(a.baslangic)} – ${gunMetni(son)}`;
}
