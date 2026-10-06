// Build denetimi: kaydetmeden önce sunucuda (lib/data/builds.ts), planlayıcıda canlı olarak aynı kurallar.
// Hata kaydı engeller (fazla puan, 255 sınırı, sınıfa uymayan eşya); uyarı engellemez (eşyanın gerektirdiği level/stat).
import type { Build, EsyaDetayi, IrkStatlari, StatAdi } from "@/lib/types";
import { MAX_LEVEL, MAX_REB, type OyunKurallari, agacSiniri, skillHavuzu, statHavuzu } from "./kurallar";

/** Ekipman yuvaları, build.ekipman anahtarı bu dizideki sıra (prototipteki SLOT_TYPES) */
export const YUVALAR = [
  "silah", "ikinci", "kask", "zirh", "pantolon", "eldiven", "bot", "kolye", "kupe", "kupe", "yuzuk", "yuzuk", "kemer",
  "cospre_kask", "cospre_zirh", "cospre_eldiven", "kanat", "dovme", "amblem",
] as const;

export const STATLAR: readonly StatAdi[] = ["str", "hp", "dex", "int", "mp"];
const STAT_KISA: Record<StatAdi, string> = { str: "STR", hp: "HP", dex: "DEX", int: "INT", mp: "MP" };
/** Eşya değerlerinde gereken stat alanları (KO Bugda adları) */
const GEREKEN: Record<StatAdi, string> = {
  str: "RequiredStrength", hp: "RequiredHealth", dex: "RequiredDexterity", int: "RequiredIntelligence", mp: "RequiredMagicPower",
};
export const MAX_ARTI = 31;

export type DenetlenecekBuild = Pick<Build, "sinif" | "irkTuru" | "level" | "reb" | "statlar" | "skiller" | "ekipman">;

export interface DenetimBaglami {
  kurallar: OyunKurallari;
  /** build.irkTuru'nun satırı; yoksa null */
  irk: IrkStatlari | null;
  /** Ekipmandaki eşyalar, dereceleriyle (katalogda olmayan kimlik burada da yok) */
  esyalar: Map<number, EsyaDetayi>;
  /** class_trees adları (3 ağaç + master); verilmezse "1. ağaç" … "Master" */
  agaclar?: string[];
}

export interface BuildDenetimi {
  hatalar: string[];
  uyarilar: string[];
  statHavuzu: number;
  statKullanilan: number;
  skillHavuzu: number;
  skillKullanilan: number;
}

const tamSayi = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);

export function buildDenetle(b: DenetlenecekBuild, bag: DenetimBaglami): BuildDenetimi {
  const { kurallar: k, irk } = bag;
  const hatalar: string[] = [];
  const uyarilar: string[] = [];

  const levelGecerli = tamSayi(b.level) && b.level >= 1 && b.level <= MAX_LEVEL;
  if (!levelGecerli) hatalar.push(`Level 1 ile ${MAX_LEVEL} arası olmalı`);
  if (!tamSayi(b.reb) || b.reb < 0 || b.reb > MAX_REB) hatalar.push(`Reb 0 ile ${MAX_REB} arası olmalı`);
  else if (b.reb && b.level !== MAX_LEVEL) hatalar.push(`Reb yalnızca level ${MAX_LEVEL}'te verilir`);
  const level = levelGecerli ? b.level : 1;
  const reb = tamSayi(b.reb) ? Math.min(Math.max(b.reb, 0), MAX_REB) : 0;

  if (!b.irkTuru || !irk) hatalar.push("Irk seçilmeli");
  else if (!irk.siniflar.includes(b.sinif)) hatalar.push(`${irk.ad} bu sınıfı seçemez`);

  // Stat: dağıtılan puan ırk başlangıcının üstüne; her stat stat_cap'i geçemez (eşya bonusları sınır dışı)
  const sHavuz = statHavuzu(k, level, reb);
  let sKullanilan = 0;
  for (const s of STATLAR) {
    const v = b.statlar?.[s];
    if (!tamSayi(v) || v < 0) { hatalar.push(`${STAT_KISA[s]} puanı negatif olmayan tam sayı olmalı`); continue; }
    sKullanilan += v;
    if (irk && irk.statlar[s] + v > k.statCap) hatalar.push(`${STAT_KISA[s]} en fazla ${k.statCap} olabilir (${irk.statlar[s]} + ${v})`);
  }
  if (b.statlar && Object.keys(b.statlar).some((s) => !STATLAR.includes(s as StatAdi))) hatalar.push("Bilinmeyen stat");
  if (sKullanilan > sHavuz) hatalar.push(`Stat puanı fazla: ${sKullanilan} dağıtıldı, bu levelde ${sHavuz}`);

  // Skill: 3 ağaç + master, ortak havuz
  const kHavuz = skillHavuzu(k, level);
  let kKullanilan = 0;
  const adlar = bag.agaclar ?? ["1. ağaç", "2. ağaç", "3. ağaç", "Master"];
  if (!Array.isArray(b.skiller) || b.skiller.length !== 4) hatalar.push("Skill dağılımı 3 ağaç ve master'dan oluşur");
  else {
    b.skiller.forEach((v, i) => {
      if (!tamSayi(v) || v < 0) { hatalar.push(`${adlar[i]} puanı negatif olmayan tam sayı olmalı`); return; }
      kKullanilan += v;
      const sinir = agacSiniri(k, b.sinif, (i + 1) as 1 | 2 | 3 | 4, level);
      if (v > sinir) hatalar.push(i === 3 && sinir === 0 ? `Master level ${k.masterLevel}'tan sonra açılır` : `${adlar[i]} bu levelde en fazla ${sinir}`);
    });
  }
  if (kKullanilan > kHavuz) hatalar.push(`Skill puanı fazla: ${kKullanilan} dağıtıldı, bu levelde ${kHavuz}`);

  // Ekipman
  for (const [yuvaNo, takili] of Object.entries(b.ekipman ?? {})) {
    const i = Number(yuvaNo);
    const yuva = /^\d+$/.test(yuvaNo) ? YUVALAR[i] : undefined;
    if (!yuva) { hatalar.push(`Bilinmeyen ekipman yuvası: ${yuvaNo}`); continue; }
    const e = bag.esyalar.get(takili?.itemId);
    if (!e) { hatalar.push(`Katalogda olmayan eşya: ${takili?.itemId}`); continue; }
    const ad = e.ad.replace("{ad}", "").trim();
    if (!e.yuvalar.includes(yuva)) hatalar.push(`${ad} bu yuvaya takılmaz`);
    if (e.siniflar.length && !e.siniflar.includes(b.sinif)) hatalar.push(`${ad} bu sınıfa uygun değil`);
    if (!tamSayi(takili.arti) || takili.arti < 0 || takili.arti > MAX_ARTI) { hatalar.push(`${ad}: artı 0 ile ${MAX_ARTI} arası olmalı`); continue; }
    if (!e.dereceler.length) continue;  // derecesi bilinmeyen eşya (takı, cospre): değer yok, artı serbest
    const satir = e.dereceler.find((d) => d.arti === takili.arti);
    if (!satir) { hatalar.push(`${ad} için +${takili.arti} yok`); continue; }
    const gerLevel = satir.degerler.RequiredLevel ?? 0;
    if (gerLevel > level) uyarilar.push(`${ad} level ${gerLevel} ister`);
    if (irk) for (const s of STATLAR) {
      const ger = satir.degerler[GEREKEN[s]] ?? 0;
      const sende = irk.statlar[s] + (tamSayi(b.statlar?.[s]) ? b.statlar[s] : 0);
      if (ger > sende) uyarilar.push(`${ad} ${STAT_KISA[s]} ${ger} ister (sende ${sende})`);
    }
  }

  return { hatalar, uyarilar, statHavuzu: sHavuz, statKullanilan: sKullanilan, skillHavuzu: kHavuz, skillKullanilan: kKullanilan };
}
