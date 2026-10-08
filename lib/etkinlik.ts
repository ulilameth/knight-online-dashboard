// Etkinlikler ekranının saf hesapları: form çözme, yoklama kadrosu, liste grupları.
import type { EtkinlikGirdisi } from "@/lib/data/events";
import { RUTBELER } from "@/lib/etiketler";
import { saatMetni, tsi, tsiGunu } from "@/lib/time";
import type { Etkinlik, EtkinlikTuru, Karakter, Yoklama, YoklamaDurumu } from "@/lib/types";

export interface EtkinlikFormu {
  tur: string;
  baslik: string;
  /** TSİ gün, "2026-11-22" */
  tarih: string;
  /** TSİ saat, "21:00" */
  saat: string;
  /** Dakika; boş ya da 0 ise bitiş yok */
  sure: string;
  aciklama: string;
}

export const SURE_EN_COK = 24 * 60;

/** Form alanlarını veri katmanının girdisine çevirir; hata varsa kullanıcıya gösterilecek mesajı döner */
export function etkinlikFormunuCoz(f: EtkinlikFormu, turler: EtkinlikTuru[]): EtkinlikGirdisi | { hata: string } {
  const baslik = f.baslik.trim();
  if (!turler.some((t) => t.kod === f.tur)) return { hata: "Etkinlik türünü seç" };
  if (!baslik || baslik.length > 120) return { hata: "Başlık 1-120 karakter olmalı" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.tarih) || Number.isNaN(Date.parse(`${f.tarih}T00:00:00Z`))) return { hata: "Tarih geçersiz" };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.saat)) return { hata: "Saat SS:DD biçiminde olmalı" };
  const sure = f.sure.trim() === "" ? 0 : Number(f.sure);
  if (!Number.isInteger(sure) || sure < 0 || sure > SURE_EN_COK) return { hata: "Süre 0-1440 dakika olmalı" };
  const aciklama = f.aciklama.trim();
  if (aciklama.length > 1000) return { hata: "Açıklama en çok 1000 karakter olabilir" };
  const baslangic = tsi(`${f.tarih}T${f.saat}`);
  return {
    tur: f.tur, baslik, baslangic,
    bitis: sure ? new Date(Date.parse(baslangic) + sure * 60_000).toISOString() : null,
    aciklama: aciklama || null,
  };
}

/** Düzenleme formunun başlangıç değerleri */
export function etkinliktenForm(e: Etkinlik): EtkinlikFormu {
  return {
    tur: e.tur, baslik: e.baslik, tarih: tsiGunu(e.baslangic), saat: saatMetni(e.baslangic),
    sure: e.bitis ? String(Math.round((Date.parse(e.bitis) - Date.parse(e.baslangic)) / 60_000)) : "",
    aciklama: e.aciklama ?? "",
  };
}

/** Yoklama etkinlik saatinde açılır */
export const yoklamaAcik = (e: Etkinlik, su: Date) => Date.parse(e.baslangic) <= su.getTime();

/**
 * Bir etkinliğin yoklama kadrosu: ayrılmamış ana karakterler ve o etkinlikte işaretlenmiş herkes
 * (sonradan ayrılan biri geçmiş yoklamada görünmeye devam eder). Rütbe, sonra nick sırasıyla.
 */
export function yoklamaKadrosu(karakterler: Karakter[], yoklamalar: Yoklama[], eventId: string): Karakter[] {
  const isaretli = new Set(yoklamalar.filter((y) => y.eventId === eventId).map((y) => y.characterId));
  return karakterler
    .filter((k) => isaretli.has(k.id) || (k.anaKarakter && k.durum !== "ayrildi"))
    .sort((a, b) => RUTBELER.indexOf(a.rutbe) - RUTBELER.indexOf(b.rutbe) || a.ad.localeCompare(b.ad, "tr"));
}

/** characterId → durum */
export function isaretHaritasi(yoklamalar: Yoklama[], eventId: string): Record<string, YoklamaDurumu> {
  return Object.fromEntries(yoklamalar.filter((y) => y.eventId === eventId).map((y) => [y.characterId, y.durum]));
}

/** Liste: yaklaşanlar (en yakın önce, en çok 4) ve geçmiş (en yeni önce) */
export function etkinlikGruplari(etkinlikler: Etkinlik[], su: Date, yaklasanAdet = 4) {
  const sirali = [...etkinlikler].sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  return {
    yaklasan: sirali.filter((e) => !yoklamaAcik(e, su)).slice(0, yaklasanAdet),
    gecmis: sirali.filter((e) => yoklamaAcik(e, su)).reverse(),
  };
}

/** Seçili etkinlik yoksa: son geçmiş etkinlik, o da yoksa ilk yaklaşan */
export function varsayilanEtkinlik(g: ReturnType<typeof etkinlikGruplari>): Etkinlik | undefined {
  return g.gecmis[0] ?? g.yaklasan[0];
}
