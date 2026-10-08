// Eşya kataloğu: design/katalog.json (scripts/katalog_olustur.py, KO Bugda verisi).
// Derece satırı: [derece, AP, savunma, gerekli level, gerekli STR, HP, DEX, INT, MP, bonus STR, HP, DEX, INT, MP,
// sonra BONUSLAR'daki sütunlar]. Dosyada satır sonundaki sıfırlar atılmıştır; burada ALAN_SAYISI'na tamamlanır.
import type { Sinif } from "@/lib/types";

export const ALAN_SAYISI = 40;

export type YuvaTuru =
  | "silah" | "ikinci" | "kask" | "zirh" | "pantolon" | "eldiven" | "bot" | "kolye" | "kupe" | "yuzuk" | "kemer"
  | "cospre_kask" | "cospre_zirh" | "cospre_eldiven" | "kanat" | "dovme" | "amblem";
export type EsyaDerecesi = "normal" | "set" | "unique" | "rare" | "draki" | "cospre";

/** Build'deki 19 yuvanın türü (sıra = build.ekipman anahtarı) */
export const YUVA_TURLERI: readonly YuvaTuru[] = [
  "silah", "ikinci", "kask", "zirh", "pantolon", "eldiven", "bot", "kolye", "kupe", "kupe", "yuzuk", "yuzuk", "kemer",
  "cospre_kask", "cospre_zirh", "cospre_eldiven", "kanat", "dovme", "amblem",
];
export const YUVA_ADLARI = [
  "Silah", "İkinci el", "Kask", "Zırh", "Pantolon", "Eldiven", "Bot", "Kolye", "Küpe 1", "Küpe 2", "Yüzük 1", "Yüzük 2", "Kemer",
  "Cospre başlık", "Cospre zırh", "Cospre eldiven", "Kanat", "Dövme", "Amblem",
] as const;

/** Ekipman panelinin bölümleri: [başlık, açıklama, yuva sıraları] */
export const EKIPMAN_BOLUMLERI: readonly [string, string, readonly number[]][] = [
  ["Silahlar", "", [0, 1]],
  ["Zırh seti", "kask, zırh, pantolon, eldiven, bot", [2, 3, 4, 5, 6]],
  ["Takılar", "kolye, küpe, yüzük, kemer", [7, 8, 9, 10, 11, 12]],
  ["Cospre", "başlık, zırh, eldiven, kanat, dövme, amblem", [13, 14, 15, 16, 17, 18]],
];

/** Derece satırındaki bonus sütunları: [sütun, tablo başlığı, toplamdaki adı, birim] */
export const BONUSLAR: readonly [number, string, string, string?][] = [
  [9, "+STR", "STR"], [10, "+HP", "HP stat"], [11, "+DEX", "DEX"], [12, "+INT", "INT"], [13, "+MP", "MP stat"],
  [14, "Can", "Can (HP)"], [15, "Mana", "Mana (MP)"], [16, "+Savunma", "Savunma"], [17, "Hasar %", "Hasar", "%"], [18, "Savunma %", "Savunma", "%"],
  [19, "Ateş hasarı", "Ateş hasarı"], [20, "Buz hasarı", "Buz hasarı"], [21, "Şimşek hasarı", "Şimşek hasarı"], [22, "Zehir hasarı", "Zehir hasarı"],
  [23, "Ateş dir.", "Ateş direnci"], [24, "Buz dir.", "Buz direnci"], [25, "Şimşek dir.", "Şimşek direnci"], [26, "Zehir dir.", "Zehir direnci"], [27, "Karanlık dir.", "Karanlık direnci"], [28, "Büyü dir.", "Büyü direnci"],
  [29, "HP yenileme", "HP yenileme"], [30, "MP yenileme", "MP yenileme"], [31, "Kaçınma %", "Kaçınma", "%"], [32, "Yansıtma %", "Fiziksel yansıtma", "%"],
  [33, "Kılıç sav.", "Kılıca karşı savunma"], [34, "Hançer sav.", "Hançere karşı savunma"], [35, "Topuz sav.", "Topuza karşı savunma"], [36, "Balta sav.", "Baltaya karşı savunma"],
  [37, "Mızrak sav.", "Mızrağa karşı savunma"], [38, "Ok sav.", "Oka karşı savunma"], [39, "Jamadar sav.", "Jamadara karşı savunma"],
];
/** Set bonusu satırının (katalog "set_alanlari") derece satırındaki karşılığı */
export const SET_SUTUNLARI = [9, 10, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28] as const;

const KATALOG_SINIF: Record<string, Sinif> = { war: "warrior", rog: "rogue", mag: "mage", pri: "priest", kur: "kurian" };

/** design/katalog.json'un biçimi */
export interface KatalogJson {
  esyalar: { id: number; n: string; k: string; s: YuvaTuru[]; c: string[]; i: number | null; g: EsyaDerecesi; set: string | null; ef?: string; sb?: [string, number] }[];
  dereceler: Record<string, number[][]>;
  setler: { k: string; n: string; p: number[]; a?: string; an?: string; bt?: Record<string, Record<string, number[]>> }[];
  set_bonuslari: Record<string, Record<string, number[]>>;
  set_kaynak?: string;
}

export interface Esya {
  id: number;
  /** Sahibinin nick'ini taşıyanlarda {ad} yer tutucusu (esyaAdi ile doldurulur) */
  ad: string;
  kategori: string;
  yuvalar: YuvaTuru[];
  /** Boş: tüm sınıflar */
  siniflar: Sinif[];
  gorsel: number | null;
  derece: EsyaDerecesi;
  setAnahtari: string | null;
  etki: string | null;
  /** Eski KO Bugda set ailesi ve parça biti */
  setParcasi: [string, number] | null;
}

export interface EsyaSeti {
  anahtar: string;
  ad: string;
  aile: string | null;
  aileAdi: string | null;
  /** Kask, zırh, pantolon, eldiven, bot sırasında */
  parcalar: number[];
  /** kobugda.com/sets tablosu: sınıf → parça biti → bonus satırı */
  bonusTablosu: Partial<Record<Sinif, Record<string, number[]>>> | null;
}

export interface Katalog {
  esyalar: Map<number, Esya>;
  dereceler: Map<number, number[][]>;
  setler: Map<string, EsyaSeti>;
  /** Eski KO Bugda aile tabloları: "<SINIF>_<AILE>" → maske → bonus satırı */
  aileTablolari: Record<string, Record<string, number[]>>;
  setKaynagi: string;
}

const SET_SIRASI: YuvaTuru[] = ["kask", "zirh", "pantolon", "eldiven", "bot"];

export function kataloguHazirla(j: KatalogJson): Katalog {
  const esyalar = new Map<number, Esya>(j.esyalar.map((x) => [x.id, {
    id: x.id, ad: x.n, kategori: x.k, yuvalar: x.s, siniflar: x.c.map((c) => KATALOG_SINIF[c]).filter(Boolean), gorsel: x.i,
    derece: x.g, setAnahtari: x.set, etki: x.ef ?? null, setParcasi: x.sb ?? null,
  }]));
  const dereceler = new Map(Object.entries(j.dereceler).map(([id, satirlar]) =>
    [Number(id), satirlar.map((r) => r.concat(Array(Math.max(0, ALAN_SAYISI - r.length)).fill(0)))]));
  const setler = new Map<string, EsyaSeti>(j.setler.map((s) => {
    const bt = s.bt ? Object.fromEntries(Object.entries(s.bt).map(([c, t]) => [KATALOG_SINIF[c], t])) : null;
    const yuva = (id: number) => SET_SIRASI.indexOf(esyalar.get(id)?.yuvalar[0] as YuvaTuru);
    return [s.k, {
      anahtar: s.k, ad: s.n, aile: s.a ?? (s.bt ? "set" : null), aileAdi: s.an ?? (s.bt ? "Set" : null),
      parcalar: s.p.filter((id) => esyalar.has(id)).sort((a, b) => yuva(a) - yuva(b)), bonusTablosu: bt,
    }];
  }));
  return { esyalar, dereceler, setler, aileTablolari: j.set_bonuslari, setKaynagi: j.set_kaynak ?? "Eski KO Bugda tabloları" };
}

/** Sahibinin nick'ini taşıyan eşyalar ("{ad}'s Azagai") */
export const esyaAdi = (e: Esya, sahip: string) => e.ad.replace(/\{ad\}/g, sahip);

export const kullanabilir = (e: Esya, sinif: Sinif) => !e.siniflar.length || e.siniflar.includes(sinif);

export const derecelerOf = (k: Katalog, e: Esya) => k.dereceler.get(e.id) ?? [];

/** Seçili artı seviyesinin satırı; yoksa ilk derece, veri yoksa null */
export function satir(k: Katalog, e: Esya, arti: number): number[] | null {
  const d = derecelerOf(k, e);
  return d.find((r) => r[0] === arti) ?? d[0] ?? null;
}

export const gerekliLevel = (k: Katalog, e: Esya, arti: number) => satir(k, e, arti)?.[3] ?? 0;

/** "+15 DEX · +400 Can (HP)" */
export function bonusMetni(r: number[] | null, enFazla = 3): string {
  if (!r) return "";
  return BONUSLAR.filter(([i]) => r[i]).slice(0, enFazla).map(([i, , ad, birim]) => `+${r[i]}${birim ?? ""} ${ad}`).join(" · ");
}

/** "AP 134 · Lv 75" */
export function ozetMetni(k: Katalog, e: Esya, arti: number): string {
  const r = satir(k, e, arti);
  if (!r) return "";
  return [r[1] ? `AP ${r[1]}` : "", r[2] ? `Savunma ${r[2]}` : "", r[3] ? `Lv ${r[3]}` : ""].filter(Boolean).join(" · ");
}

/** İlk ve son dereceye göre aralık: "AP 135–177 · Lv 75" */
export function aralikMetni(k: Katalog, e: Esya): string {
  const d = derecelerOf(k, e);
  if (!d.length) return "Bonus verisi yok";
  const a = d[0], z = d[d.length - 1];
  const parca = (i: number, ad: string) => (a[i] || z[i] ? `${ad} ${a[i]}${z[i] !== a[i] ? `–${z[i]}` : ""}` : "");
  return [parca(1, "AP"), parca(2, "Savunma"), a[3] ? `Lv ${a[3]}` : ""].filter(Boolean).join(" · ");
}

/** Set bonusu satırı (SET_SUTUNLARI sırasında) → "+15 DEX · +400 Can (HP) · +30 tüm dirençler" */
export function setBonusMetni(r: number[] | null, enFazla = 6): string {
  if (!r) return "";
  const dir = r.slice(8);
  const cikti: string[] = [];
  SET_SUTUNLARI.slice(0, 8).forEach((c, j) => { if (r[j]) cikti.push(`+${r[j]} ${BONUSLAR.find((b) => b[0] === c)![2]}`); });
  if (dir.every((v) => v && v === dir[0])) cikti.push(`+${dir[0]} tüm dirençler`);
  else SET_SUTUNLARI.slice(8).forEach((c, j) => { if (dir[j]) cikti.push(`+${dir[j]} ${BONUSLAR.find((b) => b[0] === c)![2]}`); });
  return cikti.slice(0, enFazla).join(" · ");
}
