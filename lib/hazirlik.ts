// Hazırlık adımları: hangi açılış aşamasıyla açıldığı (aşama sırası) ve açıklamaları.
import type { HazirlikAdimi } from "@/lib/data/prep";
import type { Asama } from "@/lib/types";

export interface HazirlikTanimi {
  adim: HazirlikAdimi;
  ad: string;
  ipucu: string;
  /** Bu aşama başlayınca işaretlenebilir (null: hemen) */
  asamaSira: number | null;
  /** Yalnızca açılıştan sonra gösterilir */
  acilistanSonra?: boolean;
}

export const HAZIRLIK: readonly HazirlikTanimi[] = [
  { adim: "otp", ad: "Telefon doğrulama ve OTP", ipucu: "Yeni sunuculara OTP olmadan girilemiyor", asamaSira: null },
  { adim: "onKayit", ad: "Ön kayıt", ipucu: "İlk dönem ödüllü", asamaSira: 1 },
  { adim: "sunucuSecimi", ad: "Sunucu seçimi", ipucu: "Tüm klan aynı sunucuyu seçmeli", asamaSira: 2 },
  { adim: "karakterAdi", ad: "Nick alındı", ipucu: "Planlanan nick kapılmadan", asamaSira: 3 },
  { adim: "klanaKatildi", ad: "Klana katıldım", ipucu: "Oyunda klana davet edilince işaretle", asamaSira: 4, acilistanSonra: true },
];

/** Adımın açıldığı an (null: hep açık) */
export function acilisAni(t: HazirlikTanimi, asamalar: Asama[]): string | null {
  if (t.asamaSira === null) return null;
  return asamalar.find((a) => a.sira === t.asamaSira)?.baslangic ?? null;
}
