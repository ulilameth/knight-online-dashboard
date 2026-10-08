// Karakter tasarımının hesap motoru (design/prototype.html'deki mantık, KO Bugda gelişmiş hesaplayıcısı).
// Kurallar game_rules tablosundan gelir (kurallariOku); tablo boşsa VARSAYILAN_KURALLAR.
import type { Build, Sinif, StatAdi } from "@/lib/types";
import { ALAN_SAYISI, type Esya, type EsyaSeti, type Katalog, SET_SUTUNLARI, YUVA_TURLERI, satir } from "./katalog";

export interface Kurallar {
  olusturmaBonus: number;
  statPerLevel: number;
  statPerLevel60: number;
  rebStat: number;
  statSiniri: number;
  skillBaslangic: number;
  skillPerLevel: number;
  agacSiniri: number;
  warrior3Siniri: number;
  masterLevel: number;
  masterMax: number;
}

export const VARSAYILAN_KURALLAR: Kurallar = {
  olusturmaBonus: 10, statPerLevel: 3, statPerLevel60: 5, rebStat: 2, statSiniri: 255, skillBaslangic: 10, skillPerLevel: 2,
  agacSiniri: 80, warrior3Siniri: 83, masterLevel: 60, masterMax: 23,
};

/** game_rules satırlarından (anahtar → deger jsonb) */
export function kurallariOku(satirlar: { anahtar: string; deger: unknown }[]): Kurallar {
  const d = Object.fromEntries(satirlar.map((s) => [s.anahtar, s.deger])) as Record<string, unknown>;
  const n = (k: string, v: number) => (typeof d[k] === "number" ? (d[k] as number) : v);
  const agac = (d.agac_siniri ?? {}) as { genel?: number; warrior_3?: number };
  const V = VARSAYILAN_KURALLAR;
  return {
    olusturmaBonus: n("olusturma_bonus_stat", V.olusturmaBonus), statPerLevel: n("stat_per_level", V.statPerLevel),
    statPerLevel60: n("stat_per_level_60_ustu", V.statPerLevel60), rebStat: n("reb_bonus_stat", V.rebStat), statSiniri: n("stat_cap", V.statSiniri),
    skillBaslangic: n("skill_start_level", V.skillBaslangic), skillPerLevel: n("skill_per_level", V.skillPerLevel),
    agacSiniri: agac.genel ?? V.agacSiniri, warrior3Siniri: agac.warrior_3 ?? V.warrior3Siniri,
    masterLevel: n("master_level", V.masterLevel), masterMax: n("master_max", V.masterMax),
  };
}

export const STATLAR: readonly [StatAdi, string, string][] = [["str", "STR", "Güç"], ["hp", "HP", "Sağlık"], ["dex", "DEX", "Çeviklik"], ["int", "INT", "Zeka"], ["mp", "MP", "Büyü gücü"]];
export type Statlar = Record<StatAdi, number>;
export type BuildGirdisi = Pick<Build, "sinif" | "level" | "reb" | "statlar" | "skiller" | "ekipman">;

/** Dağıtılabilir ve kullanılan stat/skill puanları */
export function havuzlar(b: BuildGirdisi, k: Kurallar = VARSAYILAN_KURALLAR) {
  const statToplam = k.olusturmaBonus + k.statPerLevel * (Math.min(b.level, k.masterLevel) - 1)
    + k.statPerLevel60 * Math.max(0, b.level - k.masterLevel) + k.rebStat * (b.level === 83 ? b.reb : 0);
  const skillToplam = b.level >= k.skillBaslangic ? k.skillPerLevel * (b.level - k.skillBaslangic + 1) : 0;
  const statKullanilan = Object.values(b.statlar).reduce((a, x) => a + x, 0);
  const skillKullanilan = b.skiller.reduce((a, x) => a + x, 0);
  return { statToplam, skillToplam, statKullanilan, skillKullanilan, statKalan: statToplam - statKullanilan, skillKalan: skillToplam - skillKullanilan };
}

/**
 * Bir ağaca konabilecek en fazla puan: ağaç levelini geçemez, üst skill 80'de (Warrior'ın 3. ağacı 83).
 * Master (4.): level 60'tan sonra her level 1 puan, en fazla 23.
 */
export function skillSiniri(sinif: Sinif, level: number, agac: number, k: Kurallar = VARSAYILAN_KURALLAR) {
  if (agac === 3) return level <= k.masterLevel ? 0 : Math.min(k.masterMax, level - k.masterLevel);
  return Math.min(level, sinif === "warrior" && agac === 2 ? k.warrior3Siniri : k.agacSiniri);
}

export const karakterStatlari = (irk: Statlar, b: Pick<Build, "statlar">): Statlar =>
  Object.fromEntries(STATLAR.map(([s]) => [s, irk[s] + b.statlar[s]])) as Statlar;

// --- Set bonusu ---

const SET_YUVALARI = ["kask", "zirh", "pantolon", "eldiven", "bot"] as const;
const PARCA_BITI: Record<(typeof SET_YUVALARI)[number], number> = { kask: 1, zirh: 2, pantolon: 4, bot: 8, eldiven: 16 };
export const PARCA_ADI: Record<number, string> = { 1: "kask", 2: "zırh", 4: "pantolon", 8: "bot", 16: "eldiven" };
const TABLO_ONEKI: Record<Sinif, string> = { warrior: "WARRIOR", rogue: "ROGUE", mage: "MAGE", priest: "PRIEST", kurian: "WARRIOR" };

export const setOf = (kat: Katalog, e: Esya | undefined) => (e?.setAnahtari ? kat.setler.get(e.setAnahtari) ?? null : null);

/** Eski aile tablosu: Kurian, Warrior'ın kullanamadığı (Portu) parçalarda kendi tablosunu kullanır */
function aileTablosu(kat: Katalog, sinif: Sinif, e: Esya) {
  const [aile] = e.setParcasi!;
  if (sinif === "kurian" && !e.siniflar.includes("warrior") && kat.aileTablolari[`KURIAN_${aile}`]) return `KURIAN_${aile}`;
  return `${TABLO_ONEKI[sinif]}_${aile}`;
}

/** kobugda.com/sets tablosu: takılı parçaların kapsadığı en büyük kombinasyon */
function kendiTablosu(sinif: Sinif, st: EsyaSeti | null) {
  if (!st?.bonusTablosu) return null;
  return st.bonusTablosu[sinif] ?? (sinif === "kurian" ? st.bonusTablosu.warrior : null) ?? null;
}
function kapsayanSatir(tablo: Record<string, number[]>, maske: number) {
  let en = 0;
  for (const m of Object.keys(tablo)) { const n = Number(m); if (n && (maske & n) === n && n > en) en = n; }
  return en ? tablo[String(en)] : null;
}

/** Bir setin verilen parça kombinasyonundaki bonusu (kart ve detaylarda "tam set" için maske 31) */
export function setBonusu(kat: Katalog, sinif: Sinif, st: EsyaSeti, maske: number): number[] | null {
  const kendi = kendiTablosu(sinif, st);
  if (kendi) return kapsayanSatir(kendi, maske);
  const parca = st.parcalar.map((id) => kat.esyalar.get(id)).find((e) => e?.setParcasi);
  return parca ? kat.aileTablolari[aileTablosu(kat, sinif, parca)]?.[String(maske)] ?? null : null;
}

export interface AktifSet {
  set: EsyaSeti | null;
  maske: number;
  parca: number;
  satir: number[] | null;
}

/** Takılı eşyaların seçili derecedeki satırlarının toplamı ve set bonusları; apSabit: silah dışı eşyaların AP'si */
export function ekipmanToplami(b: BuildGirdisi, kat: Katalog) {
  const s = Array<number>(ALAN_SAYISI).fill(0);
  const setten = Array<number>(ALAN_SAYISI).fill(0);
  let apSabit = 0, adet = 0;
  YUVA_TURLERI.forEach((_, i) => {
    const g = b.ekipman[String(i)], e = g && kat.esyalar.get(g.itemId);
    if (!e) return;
    adet++;
    const r = satir(kat, e, g.arti);
    if (!r) return;
    for (let k = 1; k < ALAN_SAYISI; k++) if (k < 3 || k > 8) s[k] += r[k] || 0;
    if (i > 1) apSabit += r[1] || 0;
  });
  // Set bonusu: aynı tablodaki takılı parçaların bitleri toplanır (setin kendi tablosu, yoksa eski aile tablosu)
  const aktif = new Map<string, AktifSet & { kendi: Record<string, number[]> | null; anahtar: string }>();
  for (const t of SET_YUVALARI) {
    const i = YUVA_TURLERI.indexOf(t), g = b.ekipman[String(i)], e = g && kat.esyalar.get(g.itemId);
    if (!e) continue;
    const st = setOf(kat, e), kendi = kendiTablosu(b.sinif, st);
    if (!kendi && !e.setParcasi) continue;
    const anahtar = kendi ? `set:${st!.anahtar}` : aileTablosu(kat, b.sinif, e);
    const a = aktif.get(anahtar) ?? { set: st, maske: 0, parca: 0, satir: null, kendi, anahtar };
    a.maske |= PARCA_BITI[t];
    a.parca++;
    aktif.set(anahtar, a);
  }
  const setler: AktifSet[] = [...aktif.values()].map((a) => ({
    set: a.set, maske: a.maske, parca: a.parca,
    satir: a.kendi ? kapsayanSatir(a.kendi, a.maske) : kat.aileTablolari[a.anahtar]?.[String(a.maske)] ?? null,
  }));
  for (const x of setler) if (x.satir) SET_SUTUNLARI.forEach((c, j) => { s[c] += x.satir![j]; setten[c] += x.satir![j]; });
  return { s, setten, apSabit, adet, setler };
}

// --- AP, HP, MP, savunma ---

type HesapSinifi = "WARRIOR" | "ROGUE" | "MAGE" | "PRIEST" | "KURIAN";
type SilahTuru = "axe" | "dagger" | "bow" | "crossbow" | "club" | "sword" | "staff";
const HESAP_SINIFI: Record<Sinif, HesapSinifi> = { warrior: "WARRIOR", rogue: "ROGUE", mage: "MAGE", priest: "PRIEST", kurian: "KURIAN" };

/** KO Bugda katsayıları: [level 1–9, 10–59, 60–83] */
const AP_KATSAYI: Record<HesapSinifi, Partial<Record<SilahTuru, [number, number, number]>>> = {
  WARRIOR: { axe: [0.00013, 0.00025, 0.00032] },
  ROGUE: { dagger: [0.00015, 0.00025, 0.00032], bow: [0.00015, 0.00035, 0.00038], crossbow: [0.00015, 0.00035, 0.00038] },
  PRIEST: { club: [0.00005, 0.0002, 0.00025], sword: [0, 0, 0.00025] },
  MAGE: { staff: [0.0001, 0.00015, 0.00015] },
  KURIAN: { sword: [0.0001, 0.0002, 0.0002] },
};
const HP_KATSAYI: Record<HesapSinifi, [number, number, number]> = { WARRIOR: [0.0015, 0.003, 0.003], ROGUE: [0.0005, 0.0015, 0.0015], PRIEST: [0.001, 0.0012, 0.0015], MAGE: [0.0004, 0.0008, 0.001], KURIAN: [0.0015, 0.003, 0.002] };
const MP_KATSAYI: Record<HesapSinifi, [number, number, number]> = { WARRIOR: [0.0015, 0.003, 0.003], ROGUE: [0.0015, 0.003, 0.003], PRIEST: [0.0015, 0.0015, 0.0015], MAGE: [0.0015, 0.0015, 0.0018], KURIAN: [0.0005, 0.0005, 0.0032] };
export const SILAH_ADI: Record<SilahTuru, string> = { axe: "Silah", dagger: "Hançer", bow: "Yay", crossbow: "Arbalet", club: "Topuz", sword: "Silah", staff: "Asa" };
const kademe = (lv: number) => (lv >= 60 ? 2 : lv >= 10 ? 1 : 0);

export interface ApGirdisi {
  hs: HesapSinifi;
  silah: SilahTuru;
  level: number;
  /** Sağ el silahının AP'si */
  silahAp: number;
  /** Sol el silahının AP'si (kalkan değilse) */
  solAp: number;
  stat: number;
  bazAp: number;
  /** Toplam hasar bonusu (%) */
  yuzde: number;
  wes: boolean;
}

export function apHesapla(o: ApGirdisi): number {
  const t = AP_KATSAYI[o.hs][o.silah];
  if (!t) return 3;
  const k = t[kademe(o.level)], n = (o.yuzde + 100) / 100;
  let i = o.silahAp + (o.wes ? 5 : 0);
  if (o.solAp > 0) i += Math.floor(0.5 * (o.solAp + (o.wes && o.hs === "ROGUE" ? 3 : 0)));
  if (i < 3) i = 3;
  let ap = Math.floor(Math.floor(0.005 * i * (o.stat + 40) + k * i * o.level * o.stat + 3) * n) + o.bazAp;
  if (o.wes) ap += 1;
  return Math.max(ap, 3);
}

/** AP panelindeki buff seçimleri ve elle eklenenler */
export interface Ekler {
  wes: boolean;
  wolf: boolean;
  /** Ek STR/DEX/INT (scroll, buff) */
  ekStat: number;
  /** Ek AP bonusu (%) */
  ekYuzde: number;
}
export const EK_YOK: Ekler = { wes: false, wolf: false, ekStat: 0, ekYuzde: 0 };

/** Statlar, eşyalar ve setlerle AP, savunma, can, mana ve direnç tabanı */
export function hesapla(b: BuildGirdisi, irk: Statlar, kat: Katalog, x: Ekler = EK_YOK) {
  const G = ekipmanToplami(b, kat), ch = karakterStatlari(irk, b);
  const toplam = Object.fromEntries(STATLAR.map(([s], j) => [s, ch[s] + G.s[9 + j]])) as Statlar;
  const hs = HESAP_SINIFI[b.sinif], lv = Math.min(b.level, 83);
  const yuva = (i: number) => {
    const g = b.ekipman[String(i)], e = g && kat.esyalar.get(g.itemId);
    return e ? { e, r: satir(kat, e, g.arti) } : null;
  };
  const sag = yuva(0), sol = yuva(1);
  const silahAp = sag?.r ? sag.r[1] : 0;
  const solSilahAp = sol?.r && sol.e.kategori !== "Shield" ? sol.r[1] : 0;
  let silah: SilahTuru = "sword", solAp = 0;
  if (hs === "WARRIOR") { silah = "axe"; solAp = solSilahAp; }
  else if (hs === "ROGUE") {
    if (sag && (sag.e.kategori === "Bow" || sag.e.kategori === "Crossbow")) silah = sag.e.kategori === "Bow" ? "bow" : "crossbow";
    else { silah = "dagger"; solAp = solSilahAp; }
  } else if (hs === "PRIEST") silah = sag && sag.e.kategori.startsWith("Club") ? "club" : "sword";
  else if (hs === "MAGE") silah = "staff";
  const intPriest = hs === "PRIEST" && !!sag && sag.e.kategori === "Priest Weapon / Mace";
  const apStati: StatAdi = hs === "ROGUE" ? "dex" : intPriest ? "int" : "str";
  const stat = toplam[apStati] + x.ekStat;
  let bazAp = 0;
  if (hs !== "ROGUE") { const c = intPriest ? ch.int : ch.str; if (c > 150) bazAp = c - 150 - (c === 160 ? 1 : 0); }
  const yuzde = G.s[17] + (x.wolf ? 20 : 0) + x.ekYuzde;
  const ap = apHesapla({ hs, silah, level: lv, silahAp, solAp, stat, bazAp: bazAp + G.apSabit, yuzde, wes: x.wes });
  const hk = HP_KATSAYI[hs][kademe(lv)], mk = MP_KATSAYI[hs][kademe(lv)], h = toplam.hp;
  const can = Math.min(14000, G.s[14] + Math.floor(hk * lv * lv * h + lv * h * 0.1 + Math.floor(h / 5)) + 20);
  let mana: number;
  if (hs === "MAGE" || hs === "PRIEST") { const m = toplam.int + 30; mana = Math.floor(mk * lv * lv * m + 0.1 * lv * 2 * m + Math.floor(m / 5)) + 20; }
  else mana = Math.floor(mk * lv * lv * h + 0.1 * lv * h + Math.floor(h / 5));
  mana += G.s[15];
  let savunma = lv + (hs !== "KURIAN" && ch.hp > 100 ? ch.hp - 100 : 0) + G.s[2] + G.s[16];
  if (hs === "KURIAN") savunma = Math.floor(0.8 * savunma);
  if (G.s[18] > 0) savunma = Math.floor((savunma * (G.s[18] + 100)) / 100);
  const direncTabani = toplam.int > 101 ? Math.floor((toplam.int - 100) / 2) : 0;
  return {
    G, karakter: ch, toplam, hs, level: lv, silah, silahAp, solAp, stat, apStati, intPriest, bazAp, yuzde, ap, can, mana, savunma,
    direncTabani, katsayi: AP_KATSAYI[hs][silah]?.[kademe(lv)] ?? 0,
  };
}

export const DIRENCLER: readonly [number, string][] = [[23, "Ateş"], [24, "Buz"], [25, "Şimşek"], [26, "Zehir"], [27, "Karanlık"], [28, "Büyü"]];
