// Otomatik hesap paneli: takılı eşyaların toplamı, set bonusu, AP, can, mana, savunma, direnç.
// Formüller ve katsayılar KO Bugda gelişmiş hesaplayıcısından (design/prototype.html'deki apCalc/derived ile aynı);
// oyunla doğrulanmadı, arayüz "KO Bugda gelişmiş" kaynağını gösterir. Saf fonksiyonlar: sunucu ve planlayıcı aynısını kullanır.
import type { Build, EsyaDetayi, IrkStatlari, SetBonusSatiri, Sinif, StatAdi } from "@/lib/types";
import { STATLAR, YUVALAR } from "./build";

/** AP panelindeki seçimler (builds.ap_girdileri) */
export interface HesapGirdileri {
  /** Weapon Enchant Scroll */
  wes: boolean;
  /** Wolf: +%20 hasar */
  wolf: boolean;
  /** Elle eklenen ana stat */
  ekStat: number;
  /** Elle eklenen hasar yüzdesi */
  ekYuzde: number;
}

export const VARSAYILAN_GIRDILER: HesapGirdileri = { wes: false, wolf: false, ekStat: 0, ekYuzde: 0 };

/** builds.ap_girdileri jsonb'sini (eksik ya da bozuk olabilir) güvenle okur */
export function hesapGirdileri(x: unknown): HesapGirdileri {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const sayi = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return { wes: o.wes === true, wolf: o.wolf === true, ekStat: sayi(o.ekStat), ekYuzde: sayi(o.ekYuzde) };
}

/** Eşya değer alanları: bonus statlar (stat adına göre) */
const BONUS_STAT: Record<StatAdi, string> = {
  str: "BonusStrength", hp: "BonusHealth", dex: "BonusDexterity", int: "BonusIntelligence", mp: "BonusMagicPower",
};
/** Eski KO Bugda set tablosu alanları (katalog.json set_alanlari) → eşya değer alanı */
const SET_ALANI: Record<string, string> = {
  str: "BonusStrength", health: "BonusHealth", dex: "BonusDexterity", int: "BonusIntelligence", magicpower: "BonusMagicPower",
  hp: "BonusHp", mp: "BonusMp", ac: "BonusAc", resfire: "ResistanceFlame", resglacier: "ResistanceGlacier",
  reslighting: "ResistanceLighting", respoison: "ResistancePoison", resdark: "ResistanceDark", resmagic: "ResistanceMagic",
};
export const DIRENCLER = ["ResistanceFlame", "ResistanceGlacier", "ResistanceLighting", "ResistancePoison", "ResistanceDark", "ResistanceMagic"] as const;

/** Set parçalarının yuvası ve biti: takılı parçaların bit toplamı tablodaki satırı seçer */
const PARCA_BITI: Record<string, number> = { kask: 1, zirh: 2, pantolon: 4, bot: 8, eldiven: 16 };
const SET_TABLO_ONEKI: Record<Sinif, string> = { warrior: "WARRIOR", rogue: "ROGUE", mage: "MAGE", priest: "PRIEST", kurian: "WARRIOR" };

export interface AktifSet {
  /** Eski KO Bugda tablosu, ör. WARRIOR_KROWAZ */
  tablo: string;
  maske: number;
  parca: number;
  /** Bu kombinasyonun bonusu; tabloda yoksa null (ör. tek parça) */
  bonus: Record<string, number> | null;
}

export interface EkipmanToplami {
  /** Takılı eşyaların (seçili artı) ve set bonuslarının toplamı; Required* alanları hariç */
  degerler: Record<string, number>;
  /** Yalnızca set bonuslarından gelen kısım */
  setDegerleri: Record<string, number>;
  /** Silah yuvaları dışındaki eşyaların AP'si (AP hesabına düz eklenir) */
  apSilahDisi: number;
  takili: number;
  setler: AktifSet[];
}

type HesapBuild = Pick<Build, "sinif" | "irkTuru" | "level" | "reb" | "statlar" | "ekipman">;

const ekle = (hedef: Record<string, number>, kaynak: Record<string, number>) => {
  for (const [k, v] of Object.entries(kaynak)) hedef[k] = (hedef[k] ?? 0) + v;
};

function satir(e: EsyaDetayi, arti: number) {
  return e.dereceler.find((d) => d.arti === arti) ?? e.dereceler[0] ?? null;
}

/** Eski aile tablosunun anahtarı. Kurian, Warrior'ın kullanamadığı (Portu) parçalarda kendi tablosunu kullanır. */
function setTablosu(sinif: Sinif, e: EsyaDetayi, tablolar: Set<string>): string {
  const aile = e.setParcasi![0];
  const kurianParcasi = e.siniflar.length > 0 && !e.siniflar.includes("warrior");
  if (sinif === "kurian" && kurianParcasi && tablolar.has(`KURIAN_${aile}`)) return `KURIAN_${aile}`;
  return `${SET_TABLO_ONEKI[sinif]}_${aile}`;
}

export function ekipmanToplami(b: HesapBuild, esyalar: Map<number, EsyaDetayi>, setBonuslari: SetBonusSatiri[]): EkipmanToplami {
  const degerler: Record<string, number> = {};
  let apSilahDisi = 0;
  let takili = 0;
  for (const [yuvaNo, t] of Object.entries(b.ekipman ?? {})) {
    const e = t && esyalar.get(t.itemId);
    if (!e) continue;
    takili++;
    const r = satir(e, t.arti);
    if (!r) continue;
    for (const [k, v] of Object.entries(r.degerler)) if (!k.startsWith("Required")) degerler[k] = (degerler[k] ?? 0) + v;
    if (Number(yuvaNo) > 1) apSilahDisi += r.degerler.AttackPower ?? 0;
  }

  // Set bonusu: aynı tablodaki takılı zırh parçalarının bitleri toplanır, tablo tam eşleşen satırı verir (eski KO Bugda)
  const tablolar = new Set(setBonuslari.map((s) => s.tablo));
  const aktif = new Map<string, { maske: number; parca: number }>();
  YUVALAR.forEach((yuva, i) => {
    const bit = PARCA_BITI[yuva];
    const t = bit ? b.ekipman?.[String(i)] : undefined;
    const e = t && esyalar.get(t.itemId);
    if (!e?.setParcasi) return;
    const tablo = setTablosu(b.sinif, e, tablolar);
    const a = aktif.get(tablo) ?? { maske: 0, parca: 0 };
    a.maske |= bit;
    a.parca++;
    aktif.set(tablo, a);
  });
  const setDegerleri: Record<string, number> = {};
  const setler: AktifSet[] = [...aktif].map(([tablo, a]) => {
    const s = setBonuslari.find((x) => x.tablo === tablo && x.maske === a.maske);
    const bonus = s ? Object.fromEntries(Object.entries(s.bonus).map(([k, v]) => [SET_ALANI[k] ?? k, v])) : null;
    if (bonus) ekle(setDegerleri, bonus);
    return { tablo, ...a, bonus };
  });
  ekle(degerler, setDegerleri);
  return { degerler, setDegerleri, apSilahDisi, takili, setler };
}

// --- AP, can, mana katsayıları: [level 1–9, 10–59, 60–83] ---
type SilahTipi = "axe" | "dagger" | "bow" | "crossbow" | "club" | "sword" | "staff";
type Kademe = [number, number, number];
const AP_KATSAYI: Record<Sinif, Partial<Record<SilahTipi, Kademe>>> = {
  warrior: { axe: [0.00013, 0.00025, 0.00032] },
  rogue: { dagger: [0.00015, 0.00025, 0.00032], bow: [0.00015, 0.00035, 0.00038], crossbow: [0.00015, 0.00035, 0.00038] },
  priest: { club: [0.00005, 0.0002, 0.00025], sword: [0, 0, 0.00025] },
  mage: { staff: [0.0001, 0.00015, 0.00015] },
  kurian: { sword: [0.0001, 0.0002, 0.0002] },
};
const CAN_KATSAYI: Record<Sinif, Kademe> = {
  warrior: [0.0015, 0.003, 0.003], rogue: [0.0005, 0.0015, 0.0015], priest: [0.001, 0.0012, 0.0015], mage: [0.0004, 0.0008, 0.001],
  kurian: [0.0015, 0.003, 0.002],
};
const MANA_KATSAYI: Record<Sinif, Kademe> = {
  warrior: [0.0015, 0.003, 0.003], rogue: [0.0015, 0.003, 0.003], priest: [0.0015, 0.0015, 0.0015], mage: [0.0015, 0.0015, 0.0018],
  kurian: [0.0005, 0.0005, 0.0032],
};
export const CAN_SINIRI = 14000;
const kademe = (level: number) => (level >= 60 ? 2 : level >= 10 ? 1 : 0);

/** KO Bugda AP formülü */
function apHesabi(o: { sinif: Sinif; silah: SilahTipi; level: number; silahAp: number; solAp: number; stat: number; tabanAp: number; yuzde: number; wes: boolean }) {
  const t = AP_KATSAYI[o.sinif][o.silah];
  if (!t) return 3;
  const k = t[kademe(o.level)];
  const n = (o.yuzde + 100) / 100;
  let i = o.silahAp + (o.wes ? 5 : 0);
  if (o.solAp > 0) i += Math.floor(0.5 * (o.solAp + (o.wes && o.sinif === "rogue" ? 3 : 0)));
  if (i < 3) i = 3;
  let ap = Math.floor(Math.floor(0.005 * i * (o.stat + 40) + k * i * o.level * o.stat + 3) * n) + o.tabanAp;
  if (o.wes) ap += 1;
  return Math.max(ap, 3);
}

export interface Hesap {
  ap: number;
  can: number;
  mana: number;
  savunma: number;
  /** Ateş, buz, şimşek, zehir, karanlık, büyü: INT'ten gelen taban + eşya ve set */
  direncler: Record<(typeof DIRENCLER)[number], number>;
  /** Irk + dağıtılan (eşyasız) */
  karakterStatlari: Record<StatAdi, number>;
  /** Irk + dağıtılan + eşya ve set bonusu */
  toplamStatlar: Record<StatAdi, number>;
  /** AP'nin hangi statla ve silah tipiyle hesaplandığı */
  anaStat: "str" | "dex" | "int";
  silahTipi: SilahTipi;
  ekipman: EkipmanToplami;
}

export function hesapla(
  b: HesapBuild,
  bag: { irk: IrkStatlari | null; esyalar: Map<number, EsyaDetayi>; setBonuslari: SetBonusSatiri[] },
  girdi: HesapGirdileri = VARSAYILAN_GIRDILER,
): Hesap {
  const G = ekipmanToplami(b, bag.esyalar, bag.setBonuslari);
  const d = G.degerler;
  const taban = bag.irk?.statlar ?? { str: 0, hp: 0, dex: 0, int: 0, mp: 0 };
  const karakterStatlari = Object.fromEntries(STATLAR.map((s) => [s, taban[s] + (b.statlar?.[s] ?? 0)])) as Record<StatAdi, number>;
  const toplamStatlar = Object.fromEntries(STATLAR.map((s) => [s, karakterStatlari[s] + (d[BONUS_STAT[s]] ?? 0)])) as Record<StatAdi, number>;
  const sinif = b.sinif;
  const level = Math.min(Math.max(b.level, 1), 83);

  // Hesap tipi sınıftan ve takılı silahtan
  const silahYuvasi = (i: number) => {
    const t = b.ekipman?.[String(i)];
    const e = t && bag.esyalar.get(t.itemId);
    return e ? { e, r: satir(e, t.arti) } : null;
  };
  const sag = silahYuvasi(0);
  const sol = silahYuvasi(1);
  const silahAp = sag?.r?.degerler.AttackPower ?? 0;
  const solSilahAp = sol?.r && sol.e.kategori !== "Shield" ? sol.r.degerler.AttackPower ?? 0 : 0;
  let silah: SilahTipi = "sword";
  let solAp = 0;
  if (sinif === "warrior") { silah = "axe"; solAp = solSilahAp; }
  else if (sinif === "rogue") {
    if (sag && (sag.e.kategori === "Bow" || sag.e.kategori === "Crossbow")) silah = sag.e.kategori === "Bow" ? "bow" : "crossbow";
    else { silah = "dagger"; solAp = solSilahAp; }
  } else if (sinif === "priest") silah = sag?.e.kategori.startsWith("Club") ? "club" : "sword";
  else if (sinif === "mage") silah = "staff";

  const intPriest = sinif === "priest" && sag?.e.kategori === "Priest Weapon / Mace";
  const anaStat = sinif === "rogue" ? "dex" : intPriest ? "int" : "str";
  let tabanAp = 0;
  if (sinif !== "rogue") {
    const c = intPriest ? karakterStatlari.int : karakterStatlari.str;
    if (c > 150) tabanAp = c - 150 - (c === 160 ? 1 : 0);
  }
  const ap = apHesabi({
    sinif, silah, level, silahAp, solAp, stat: toplamStatlar[anaStat] + girdi.ekStat, tabanAp: tabanAp + G.apSilahDisi,
    yuzde: (d.DamagePercentage ?? 0) + (girdi.wolf ? 20 : 0) + girdi.ekYuzde, wes: girdi.wes,
  });

  const k = kademe(level);
  const h = toplamStatlar.hp;
  const can = Math.min(CAN_SINIRI, (d.BonusHp ?? 0) + Math.floor(CAN_KATSAYI[sinif][k] * level * level * h + level * h * 0.1 + Math.floor(h / 5)) + 20);
  const mk = MANA_KATSAYI[sinif][k];
  let mana: number;
  if (sinif === "mage" || sinif === "priest") {
    const m = toplamStatlar.int + 30;
    mana = Math.floor(mk * level * level * m + 0.1 * level * 2 * m + Math.floor(m / 5)) + 20;
  } else mana = Math.floor(mk * level * level * h + 0.1 * level * h + Math.floor(h / 5));
  mana += d.BonusMp ?? 0;

  let savunma = level + (sinif !== "kurian" && karakterStatlari.hp > 100 ? karakterStatlari.hp - 100 : 0) + (d.Defense ?? 0) + (d.BonusAc ?? 0);
  if (sinif === "kurian") savunma = Math.floor(0.8 * savunma);
  if ((d.DefensePercentage ?? 0) > 0) savunma = Math.floor((savunma * (d.DefensePercentage + 100)) / 100);

  const dirTaban = toplamStatlar.int > 101 ? Math.floor((toplamStatlar.int - 100) / 2) : 0;
  const direncler = Object.fromEntries(DIRENCLER.map((r) => [r, dirTaban + (d[r] ?? 0)])) as Hesap["direncler"];

  return { ap, can, mana, savunma, direncler, karakterStatlari, toplamStatlar, anaStat, silahTipi: silah, ekipman: G };
}
