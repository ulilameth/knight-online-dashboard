// Karakter tasarımının puan kuralları. Sayılar game_rules tablosundan gelir (supabase/migrations/0001_init.sql seed'i);
// burada yalnızca formüller var. Saf fonksiyonlar: sunucuda kayıt denetiminde, istemcide planlayıcıda aynısı çalışır.
import type { Sinif } from "@/lib/types";

export interface OyunKurallari {
  olusturmaBonusStat: number;
  statPerLevel: number;
  /** stat_per_level_60_ustu: level 60'tan sonraki her level */
  statPerLevel60Ustu: number;
  rebBonusStat: number;
  statCap: number;
  skillStartLevel: number;
  skillPerLevel: number;
  /** Ağaç başına üst sınır: genel ve '<sinif>_<sira>' istisnaları (ör. warrior_3: 83) */
  agacSiniri: { genel: number } & Record<string, number>;
  masterLevel: number;
  masterMax: number;
  /** Doğrulanmamış kuralların anahtarları (arayüzde "doğrulanacak" etiketi) */
  dogrulanmamis: string[];
}

export interface KuralSatiri {
  anahtar: string;
  deger: unknown;
  dogrulandi: boolean;
}

/** stat_per_level_60_ustu kuralının eşiği: anahtarın adında, ayrı bir satır değil */
export const STAT_ESIK_LEVEL = 60;
export const MAX_LEVEL = 83;
export const MAX_REB = 10;

const SAYILAR = {
  olusturmaBonusStat: "olusturma_bonus_stat",
  statPerLevel: "stat_per_level",
  statPerLevel60Ustu: "stat_per_level_60_ustu",
  rebBonusStat: "reb_bonus_stat",
  statCap: "stat_cap",
  skillStartLevel: "skill_start_level",
  skillPerLevel: "skill_per_level",
  masterLevel: "master_level",
  masterMax: "master_max",
} as const;

/** game_rules satırlarını tipli kurallara çevirir; eksik ya da bozuk kural varsa hata (sessizce varsayılana düşmez) */
export function kurallariCoz(satirlar: KuralSatiri[]): OyunKurallari {
  const bul = (anahtar: string) => {
    const s = satirlar.find((x) => x.anahtar === anahtar);
    if (!s) throw new Error(`game_rules: '${anahtar}' kuralı eksik`);
    return s.deger;
  };
  const sayi = (anahtar: string) => {
    const d = bul(anahtar);
    if (typeof d !== "number" || !Number.isInteger(d) || d < 0) throw new Error(`game_rules: '${anahtar}' negatif olmayan tam sayı olmalı`);
    return d;
  };
  const agac = bul("agac_siniri") as Record<string, unknown> | null;
  if (!agac || typeof agac !== "object" || !Object.values(agac).every((v) => Number.isInteger(v)) || !Number.isInteger(agac.genel)) {
    throw new Error("game_rules: 'agac_siniri' {genel: sayı, ...} olmalı");
  }
  const sayilar = Object.fromEntries(Object.entries(SAYILAR).map(([ad, anahtar]) => [ad, sayi(anahtar)])) as Record<keyof typeof SAYILAR, number>;
  return {
    ...sayilar,
    agacSiniri: agac as OyunKurallari["agacSiniri"],
    dogrulanmamis: satirlar.filter((s) => !s.dogrulandi).map((s) => s.anahtar),
  };
}

/** Dağıtılabilir toplam stat puanı (ırk başlangıç statlarının üstüne). Reb yalnızca level 83'te sayılır. */
export function statHavuzu(k: OyunKurallari, level: number, reb: number): number {
  const ilk = Math.min(level, STAT_ESIK_LEVEL) - 1;
  const sonra = Math.max(0, level - STAT_ESIK_LEVEL);
  return k.olusturmaBonusStat + k.statPerLevel * ilk + k.statPerLevel60Ustu * sonra + k.rebBonusStat * (level === MAX_LEVEL ? reb : 0);
}

/** Toplam skill puanı: skill_start_level'da başlar, her level skill_per_level; reb puan vermez. Master da bu havuzdan. */
export function skillHavuzu(k: OyunKurallari, level: number): number {
  return level >= k.skillStartLevel ? k.skillPerLevel * (level - k.skillStartLevel + 1) : 0;
}

/**
 * Bir ağaca konabilecek en fazla puan. sira 1-3 ağaçlar, 4 master.
 * Ağaç levelini geçemez ve üst skill'in levelinde durur; master level master_level'dan sonra açılır, en fazla master_max.
 */
export function agacSiniri(k: OyunKurallari, sinif: Sinif, sira: 1 | 2 | 3 | 4, level: number): number {
  if (sira === 4) return level <= k.masterLevel ? 0 : Math.min(k.masterMax, level - k.masterLevel);
  return Math.min(level, k.agacSiniri[`${sinif}_${sira}`] ?? k.agacSiniri.genel);
}
