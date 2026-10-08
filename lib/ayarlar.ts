// Ayarlar ekranının saf hesapları: klan bilgisi ve aşama formları, davet kodu durumu.
import type { AsamaGirdisi } from "@/lib/data/milestones";
import { levelSiniriCoz } from "@/lib/data/settings";
import { VeriHatasi } from "@/lib/data/ortak";
import { saatMetni, tsi, tsiGunu } from "@/lib/time";
import type { Asama, DavetKodu, KlanAyarlari, Taraf } from "@/lib/types";

const GUN = /^\d{4}-\d{2}-\d{2}$/;
const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;

export const LEVEL_SECENEKLERI = ["80", "83", ...Array.from({ length: 10 }, (_, i) => `83+${i + 1}`)];

export interface KlanFormu {
  klanAdi: string;
  monogram: string;
  irk: string;
  sunucuAdi: string;
  tsAdres: string;
  acilisGun: string;
  acilisSaat: string;
  levelSiniri: string;
}

export function klanFormunuCoz(f: KlanFormu): Partial<KlanAyarlari> | { hata: string } {
  const klanAdi = f.klanAdi.trim(), monogram = f.monogram.trim(), tsAdres = f.tsAdres.trim();
  if (!klanAdi || klanAdi.length > 20) return { hata: "Klan adı 1-20 karakter olmalı" };
  if (!/^\S{1,3}$/.test(monogram)) return { hata: "Monogram 1-3 karakter olmalı, boşluksuz" };
  if (f.irk !== "karus" && f.irk !== "el_morad") return { hata: "Irkı seç" };
  if (!tsAdres || tsAdres.length > 100) return { hata: "TeamSpeak adresi gerekli" };
  if (!GUN.test(f.acilisGun) || !SAAT.test(f.acilisSaat)) return { hata: "Açılış tarihi ve saati gerekli" };
  let sinir;
  try {
    sinir = levelSiniriCoz(f.levelSiniri);
  } catch (e) {
    return { hata: e instanceof VeriHatasi ? e.message : "Level sınırı geçersiz" };
  }
  return {
    klanAdi, monogram, irk: f.irk as Taraf, sunucuAdi: f.sunucuAdi.trim() || null, tsAdres,
    acilisAt: tsi(`${f.acilisGun}T${f.acilisSaat}`), ...sinir,
  };
}

export interface AsamaFormu {
  sira: string;
  baslik: string;
  /** TSİ gün */
  baslangicGun: string;
  /** Saati duyurulduysa "16:00", değilse boş */
  saat: string;
  /** Son gün (dahil); boşsa tek günlük ya da saatli an */
  sonGun: string;
  aciklama: string;
  kaynakUrl: string;
}

/**
 * Formdaki "son gün" dahildir; veritabanında bitiş, aşamanın bittiği andır (son günden sonraki gece yarısı).
 * Saat girilirse aşama o anda başlar (açılış gibi) ve saatBelli olur.
 */
export function asamaFormunuCoz(f: AsamaFormu, id?: number): AsamaGirdisi | { hata: string } {
  const sira = Number(f.sira);
  const baslik = f.baslik.trim();
  if (!Number.isInteger(sira) || sira < 1 || sira > 99) return { hata: "Sıra 1-99 arası olmalı" };
  if (!baslik || baslik.length > 80) return { hata: "Başlık 1-80 karakter olmalı" };
  if (!GUN.test(f.baslangicGun)) return { hata: "Başlangıç günü gerekli" };
  if (f.saat && !SAAT.test(f.saat)) return { hata: "Saat SS:DD biçiminde olmalı" };
  if (f.sonGun && !GUN.test(f.sonGun)) return { hata: "Son gün geçersiz" };
  if (f.sonGun && f.sonGun < f.baslangicGun) return { hata: "Son gün başlangıçtan önce olamaz" };
  const url = f.kaynakUrl.trim();
  if (url && !/^https?:\/\/\S+$/.test(url)) return { hata: "Kaynak bağlantısı http(s):// ile başlamalı" };
  const aciklama = f.aciklama.trim();
  if (aciklama.length > 300) return { hata: "Açıklama en çok 300 karakter" };
  const sonrakiGun = (g: string) => new Date(Date.parse(`${g}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  return {
    ...(id !== undefined && { id }),
    sira, baslik,
    baslangic: tsi(f.saat ? `${f.baslangicGun}T${f.saat}` : f.baslangicGun),
    bitis: f.sonGun ? tsi(sonrakiGun(f.sonGun)) : null,
    saatBelli: !!f.saat, aciklama: aciklama || null, kaynakUrl: url || null,
  };
}

export function asamadanForm(a: Asama): AsamaFormu {
  return {
    sira: String(a.sira), baslik: a.baslik, baslangicGun: tsiGunu(a.baslangic), saat: a.saatBelli ? saatMetni(a.baslangic) : "",
    sonGun: a.bitis ? tsiGunu(new Date(Date.parse(a.bitis) - 60_000)) : "", aciklama: a.aciklama ?? "", kaynakUrl: a.kaynakUrl ?? "",
  };
}

export type DavetDurumu = "aktif" | "iptal" | "doldu" | "suresi_doldu";
export const DAVET_DURUM_ADI: Record<DavetDurumu, string> = { aktif: "Geçerli", iptal: "İptal edildi", doldu: "Kullanım doldu", suresi_doldu: "Süresi doldu" };

export function davetDurumu(k: DavetKodu, su: Date = new Date()): DavetDurumu {
  if (!k.aktif) return "iptal";
  if (k.kullanim >= k.maxKullanim) return "doldu";
  if (Date.parse(k.bitis) <= su.getTime()) return "suresi_doldu";
  return "aktif";
}
