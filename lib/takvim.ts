// Takvim ekranının saf hesapları: ay ızgarası (pazartesiden başlar) ve günlere dağıtılmış etkinlikler/aşamalar (TSİ).
import { saatMetni, tsi, tsiGunu } from "@/lib/time";
import type { Asama, Etkinlik, EtkinlikTuru } from "@/lib/types";

export interface Ay {
  yil: number;
  /** 1-12 */
  ay: number;
}

export interface TakvimOgesi {
  id: string;
  /** TSİ gün, "2026-11-12" */
  gun: string;
  an: string;
  /** Çipteki saat ya da "Gün boyu" */
  saat: string;
  /** Çipteki kısa ad: resmi tarihler ve toplantılar başlığıyla, savaşlar türüyle */
  kisa: string;
  baslik: string;
  resmi: boolean;
  /** Etkinlik detayına bağlantı (resmi aşamalarda yok) */
  etkinlikId?: string;
}

const iki = (n: number) => String(n).padStart(2, "0");
export const ayMetni = (a: Ay) => `${a.yil}-${iki(a.ay)}`;

/** "2026-11" → ay; geçersiz ya da boşsa bugünün ayı (TSİ) */
export function ayCoz(deger: string | undefined, su: Date): Ay {
  const m = deger?.match(/^(\d{4})-(\d{2})$/);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12 && Number(m[1]) >= 2000 && Number(m[1]) <= 2100) return { yil: Number(m[1]), ay: Number(m[2]) };
  const [yil, ay] = tsiGunu(su).split("-").map(Number);
  return { yil, ay };
}

export function ayKaydir(a: Ay, n: number): Ay {
  const i = a.yil * 12 + (a.ay - 1) + n;
  return { yil: Math.floor(i / 12), ay: (i % 12) + 1 };
}

/** Ayın ilk gününün haftasının pazartesisinden son gününün haftasının pazarına kadar günler */
export function ayIzgarasi(a: Ay): string[] {
  const ilk = Date.UTC(a.yil, a.ay - 1, 1);
  const gunSayisi = new Date(Date.UTC(a.yil, a.ay, 0)).getUTCDate();
  const bas = ilk - ((new Date(ilk).getUTCDay() + 6) % 7) * 86_400_000;
  const hafta = Math.ceil(((ilk - bas) / 86_400_000 + gunSayisi) / 7);
  return Array.from({ length: hafta * 7 }, (_, i) => new Date(bas + i * 86_400_000).toISOString().slice(0, 10));
}

/** Etkinlikler ve resmi aşamalar; çok günlü aşamanın son günü ayrıca işaretlenir. Güne, sonra saate göre sıralı. */
export function takvimOgeleri(etkinlikler: Etkinlik[], asamalar: Asama[], turler: EtkinlikTuru[]): TakvimOgesi[] {
  const ogeler: TakvimOgesi[] = etkinlikler.map((e) => ({
    id: e.id, gun: tsiGunu(e.baslangic), an: e.baslangic, saat: saatMetni(e.baslangic), baslik: e.baslik, resmi: false, etkinlikId: e.id,
    kisa: e.tur === "toplanti" ? e.baslik : turler.find((t) => t.kod === e.tur)?.kisaAd ?? e.baslik,
  }));
  for (const a of asamalar) {
    const gun = tsiGunu(a.baslangic);
    ogeler.push({ id: `a${a.id}`, gun, an: a.baslangic, saat: a.saatBelli ? saatMetni(a.baslangic) : "Gün boyu", baslik: a.baslik, kisa: a.baslik, resmi: true });
    if (a.bitis) {
      const son = tsiGunu(new Date(Date.parse(a.bitis) - 60_000));
      if (son > gun) ogeler.push({ id: `a${a.id}-son`, gun: son, an: tsi(son), saat: "Son gün", baslik: `${a.baslik} (son gün)`, kisa: a.baslik, resmi: true });
    }
  }
  // Aynı günde resmi tarihler önce
  return ogeler.sort((x, y) => x.gun.localeCompare(y.gun) || Number(y.resmi) - Number(x.resmi) || x.an.localeCompare(y.an));
}
