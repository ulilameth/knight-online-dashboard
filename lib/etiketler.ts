// Arayüz etiketleri (Türkçe). Sınıf adı ırka göre değişir: El Morad'da Kurian yerine Porutu.
import type { KarakterDurum, Rutbe, Sinif, Taraf, Yetki, YoklamaDurumu } from "@/lib/types";

export const SINIFLAR: readonly Sinif[] = ["warrior", "rogue", "mage", "priest", "kurian"];
/** Prototipin CSS sınıf kısaltmaları (c-war, c-rog ...) */
export const SINIF_KISA: Record<Sinif, "war" | "rog" | "mag" | "pri" | "kur"> = { warrior: "war", rogue: "rog", mage: "mag", priest: "pri", kurian: "kur" };
export const sinifAdi = (s: Sinif, irk: Taraf) =>
  ({ warrior: "Warrior", rogue: "Rogue", mage: "Mage", priest: "Priest", kurian: irk === "el_morad" ? "Porutu" : "Kurian" })[s];

export const RUTBE_ADI: Record<Rutbe, string> = { lider: "Lider", asistan: "Asistan", subay: "Subay", uye: "Üye", aday: "Aday" };
export const YETKI_ADI: Record<Yetki, string> = { yonetici: "Yönetici", yetkili: "Yetkili", uye: "Üye" };
export const DURUM_ADI: Record<KarakterDurum, string> = { aktif: "Aktif", izinli: "İzinli", pasif: "Pasif", ayrildi: "Ayrıldı" };
export const IRK_ADI: Record<Taraf, string> = { karus: "Karus", el_morad: "El Morad" };

/** Rütbe rengi (madenler: altın > gümüş > bronz > demir), CSS değişkeni */
export const RUTBE_RENGI: Record<Rutbe, string> = {
  lider: "var(--rank-leader)", asistan: "var(--rank-assistant)", subay: "var(--rank-officer)", uye: "var(--rank-member)", aday: "var(--rank-candidate)",
};

export const RUTBELER: readonly Rutbe[] = ["lider", "asistan", "subay", "uye", "aday"];
export const DURUMLAR: readonly KarakterDurum[] = ["aktif", "izinli", "pasif", "ayrildi"];

export const YOKLAMA_DURUMLARI: readonly YoklamaDurumu[] = ["katildi", "gec", "mazeretli", "yok"];
export const YOKLAMA_ADI: Record<YoklamaDurumu, string> = { katildi: "Katıldı", gec: "Geç", mazeretli: "Mazeretli", yok: "Yok" };
/** Pill rengi */
export const YOKLAMA_TURU: Record<YoklamaDurumu, "good" | "warn" | "idle" | "crit"> = { katildi: "good", gec: "warn", mazeretli: "idle", yok: "crit" };
