// Karakter tasarımının düzenleme mantığı (saf): taslak, stat/skill yazma, eşya ve set takma, seçici listeleri.
// Ekranlar (components/karakter, components/esyalar) yalnızca bunları çağırır; hesaplar lib/oyun/hesap.ts'te.
import { sinifAdi } from "@/lib/etiketler";
import type { Build, Irk, Sinif, StatAdi, Taraf } from "@/lib/types";
import { type BuildGirdisi, EK_YOK, type Ekler, type Kurallar, STATLAR, type Statlar, havuzlar, karakterStatlari, setBonusu, setOf, skillSiniri } from "./hesap";
import { type Esya, type EsyaDerecesi, type EsyaSeti, type Katalog, YUVA_ADLARI, YUVA_TURLERI, type YuvaTuru, derecelerOf, gerekliLevel, kullanabilir, satir } from "./katalog";

export const LEVEL_EN_COK = 83;
export const REB_EN_COK = 10;

/** Ekranda düzenlenen build: kayıtlı build'in alanları + AP panelindeki ekler */
export interface Taslak extends BuildGirdisi {
  irkTuru: string | null;
  ekler: Ekler;
}

/** Arama: Türkçe küçük harf, ı/i ayrımı yok (eşya adları İngilizce: "Iron" "ıron" olmasın) */
const kucuk = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i");
const sinirla = (n: number, a: number, z: number) => Math.max(a, Math.min(z, n));

export function bosTaslak(sinif: Sinif, level = 1, reb = 0, irkTuru: string | null = null): Taslak {
  return {
    sinif, irkTuru, level: sinirla(level || 1, 1, LEVEL_EN_COK), reb: level === LEVEL_EN_COK ? sinirla(reb, 0, REB_EN_COK) : 0,
    statlar: { str: 0, hp: 0, dex: 0, int: 0, mp: 0 }, skiller: [0, 0, 0, 0], ekipman: {}, ekler: { ...EK_YOK },
  };
}

function eklerOku(x: Record<string, unknown> | null | undefined): Ekler {
  const s = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  return { wes: x?.wes === true, wolf: x?.wolf === true, ekStat: s(x?.ekStat), ekYuzde: s(x?.ekYuzde) };
}

export function buildtenTaslak(b: Pick<Build, "sinif" | "irkTuru" | "level" | "reb" | "statlar" | "skiller" | "ekipman" | "apGirdileri">): Taslak {
  return {
    sinif: b.sinif, irkTuru: b.irkTuru, level: b.level, reb: b.reb, statlar: { ...b.statlar }, skiller: [...b.skiller] as Taslak["skiller"],
    ekipman: structuredClone(b.ekipman), ekler: eklerOku(b.apGirdileri),
  };
}

/** Kaydedilecek alanlar */
export function taslaktanBuild(t: Taslak, ad: string): Omit<Build, "id" | "characterId" | "sablon" | "updatedAt"> {
  return {
    ad, sinif: t.sinif, irkTuru: t.irkTuru, level: t.level, reb: t.reb, statlar: { ...t.statlar }, skiller: [...t.skiller] as Build["skiller"],
    ekipman: structuredClone(t.ekipman), apGirdileri: { ...t.ekler },
  };
}

/** Sınıfın bu taraftaki ırkları */
export const irklarOf = (irklar: Irk[], sinif: Sinif, taraf: Taraf) => irklar.filter((r) => r.taraf === taraf && r.siniflar.includes(sinif));

/** Irk sınıfa/tarafa uymuyorsa ilkine çekilir; level 1-83, reb yalnızca 83'te */
export function taslakDuzelt(t: Taslak, irklar: Irk[], taraf: Taraf): Taslak {
  const secenek = irklarOf(irklar, t.sinif, taraf);
  const irkTuru = secenek.some((r) => r.irkTuru === t.irkTuru) ? t.irkTuru : secenek[0]?.irkTuru ?? null;
  const level = sinirla(Math.floor(t.level) || 1, 1, LEVEL_EN_COK);
  const reb = level === LEVEL_EN_COK ? sinirla(Math.floor(t.reb) || 0, 0, REB_EN_COK) : 0;
  if (irkTuru === t.irkTuru && level === t.level && reb === t.reb) return t;
  return { ...t, irkTuru, level, reb };
}

/** Sınıf değişince skill dağılımı sıfırlanır (ağaçlar farklı) */
export const sinifDegistir = (t: Taslak, sinif: Sinif): Taslak => ({ ...t, sinif, skiller: [0, 0, 0, 0] });

export type Yazim = { t: Taslak; uyari?: string };

/**
 * Stat kutusuna yazılan toplam değer (ırk başlangıcı + dağıtılan). Yazarken (son=false) aralık dışıysa beklenir;
 * kutudan çıkınca (son=true) başlangıç ile sınır ve kalan puana göre düzeltilir.
 */
export function statYaz(t: Taslak, irk: Irk, stat: StatAdi, deger: number | null, son: boolean, k: Kurallar): Yazim {
  const baz = irk.statlar[stat], ad = STATLAR.find(([s]) => s === stat)![1];
  if (deger === null) return { t };
  if (!son && (deger < baz || deger > k.statSiniri)) return { t };
  let ek = sinirla(deger, baz, k.statSiniri) - baz;
  let uyari: string | undefined;
  if (son) {
    const yer = Math.max(0, t.statlar[stat] + havuzlar(t, k).statKalan);
    if (ek > yer) { ek = yer; uyari = `${ad} en fazla ${baz + yer} olabilir: kalan stat puanı bu kadar`; }
    else if (deger > k.statSiniri) uyari = `${ad} en fazla ${k.statSiniri}`;
    else if (deger < baz) uyari = `${ad} başlangıç statı ${baz}, daha aşağı inemez`;
  }
  return { t: ek === t.statlar[stat] ? t : { ...t, statlar: { ...t.statlar, [stat]: ek } }, uyari };
}

/** − / + düğmeleri: azaltırken 0'ın altına, artırırken kalan puanın ve sınırın üstüne çıkmaz */
export function statAdim(t: Taslak, irk: Irk, stat: StatAdi, d: number, k: Kurallar): Taslak {
  const yeni = t.statlar[stat] + d;
  if (yeni < 0) return t;
  if (d > 0 && (havuzlar(t, k).statKalan < d || irk.statlar[stat] + yeni > k.statSiniri)) return t;
  return { ...t, statlar: { ...t.statlar, [stat]: yeni } };
}

export function skillYaz(t: Taslak, i: number, deger: number | null, son: boolean, k: Kurallar, agacAdi: string): Yazim {
  const sinir = skillSiniri(t.sinif, t.level, i, k);
  if (deger === null || deger < 0) return { t };
  if (!son && deger > sinir) return { t };
  let n = Math.min(deger, sinir);
  let uyari: string | undefined;
  if (son) {
    const yer = Math.max(0, t.skiller[i] + havuzlar(t, k).skillKalan);
    if (n > yer) { n = yer; uyari = `${agacAdi} en fazla ${yer} olabilir: kalan skill puanı bu kadar`; }
    else if (deger > sinir) uyari = `${agacAdi} bu levelde en fazla ${sinir}`;
  }
  if (n === t.skiller[i]) return { t, uyari };
  const skiller = [...t.skiller] as Taslak["skiller"];
  skiller[i] = n;
  return { t: { ...t, skiller }, uyari };
}

export function skillAdim(t: Taslak, i: number, d: number, k: Kurallar): Taslak {
  const yeni = t.skiller[i] + d;
  if (yeni < 0) return t;
  if (d > 0 && (havuzlar(t, k).skillKalan < d || yeni > skillSiniri(t.sinif, t.level, i, k))) return t;
  const skiller = [...t.skiller] as Taslak["skiller"];
  skiller[i] = yeni;
  return { ...t, skiller };
}

/** Kaydetmeyi engelleyen durum: level düşünce fazla kalan puan ya da ağaç sınırı */
export function taslakHatasi(t: Taslak, k: Kurallar, agacAdlari: readonly string[]): string | null {
  const h = havuzlar(t, k);
  const asan = t.skiller.map((n, i) => [n, skillSiniri(t.sinif, t.level, i, k), agacAdlari[i]] as const).filter(([n, s]) => n > s).map(([, s, ad]) => `${ad} en fazla ${s}`);
  if (h.statKalan < 0 || h.skillKalan < 0) {
    return `Dağıtılan puan bu level için fazla: ${Math.max(0, -h.statKalan)} stat, ${Math.max(0, -h.skillKalan)} skill düşür.${asan.length ? ` Ağaç sınırı: ${asan.join(", ")}.` : ""}`;
  }
  return asan.length ? `Ağaç sınırı aşıldı: ${asan.join(", ")}.` : null;
}

// --- Ekipman ---

const SET_YUVALARI: YuvaTuru[] = ["kask", "zirh", "pantolon", "eldiven", "bot"];
export const ZIRH_YUVALARI = SET_YUVALARI.map((t) => YUVA_TURLERI.indexOf(t));

/** Önceki artı seviyesi bu eşyada varsa korunur, yoksa ilk derece */
function arti(kat: Katalog, e: Esya, onceki: number | undefined) {
  const d = derecelerOf(kat, e);
  return d.some((r) => r[0] === onceki) ? onceki! : d[0]?.[0] ?? 0;
}

export function esyaTak(t: Taslak, kat: Katalog, yuva: number, esyaId: number): Taslak {
  const e = kat.esyalar.get(esyaId);
  if (!e) return t;
  return { ...t, ekipman: { ...t.ekipman, [String(yuva)]: { itemId: e.id, arti: arti(kat, e, t.ekipman[String(yuva)]?.arti) } } };
}

export function yuvaBosalt(t: Taslak, yuvalar: readonly number[]): Taslak {
  const ekipman = { ...t.ekipman };
  for (const y of yuvalar) delete ekipman[String(y)];
  return { ...t, ekipman };
}

export function artiSec(t: Taslak, yuva: number, a: number): Taslak {
  const g = t.ekipman[String(yuva)];
  return g ? { ...t, ekipman: { ...t.ekipman, [String(yuva)]: { ...g, arti: a } } } : t;
}

/** Setin 5 parçasını birlikte takar; sınıf kullanamıyorsa hata */
export function setTak(t: Taslak, kat: Katalog, anahtar: string, sinifAdi: string): { t: Taslak } | { hata: string } {
  const st = kat.setler.get(anahtar);
  if (!st) return { hata: "Set bulunamadı" };
  const parcalar = st.parcalar.map((id) => kat.esyalar.get(id)!).filter(Boolean);
  if (!parcalar.every((e) => kullanabilir(e, t.sinif))) return { hata: `${st.ad} seti ${sinifAdi} için değil` };
  let yeni = t;
  for (const e of parcalar) yeni = esyaTak(yeni, kat, YUVA_TURLERI.indexOf(e.yuvalar[0]), e.id);
  return { t: yeni };
}

/** Eşyanın girebileceği yuvalar (küpe ve yüzükte iki yuva) */
export const yuvalarOf = (e: Esya) => YUVA_TURLERI.flatMap((t, i) => (e.yuvalar.includes(t) ? [i] : []));

export const uygun = (kat: Katalog, e: Esya, t: Pick<Taslak, "sinif" | "level">, a?: number) =>
  kullanabilir(e, t.sinif) && gerekliLevel(kat, e, a ?? derecelerOf(kat, e)[0]?.[0] ?? 0) <= t.level;

const GEREKSINIM: readonly [StatAdi, number, string][] = [["str", 4, "STR"], ["hp", 5, "HP"], ["dex", 6, "DEX"], ["int", 7, "INT"], ["mp", 8, "MP"]];

/** Karşılanmayan stat gereksinimleri: "STR 160 (sende 120)" */
export function eksikGereksinim(kat: Katalog, e: Esya, a: number, karakter: Statlar): string[] {
  const r = satir(kat, e, a);
  if (!r) return [];
  return GEREKSINIM.filter(([s, i]) => r[i] && karakter[s] < r[i]).map(([s, i, ad]) => `${ad} ${r[i]} (sende ${karakter[s]})`);
}

/** Yuvadaki eşyanın uyarısı: sınıf/level uymuyor ya da stat gereksinimi eksik */
export function yuvaUyarisi(kat: Katalog, t: Taslak, irk: Irk, yuva: number): { kotu: boolean; metin: string | null } {
  const g = t.ekipman[String(yuva)], e = g && kat.esyalar.get(g.itemId);
  if (!e) return { kotu: false, metin: null };
  if (!uygun(kat, e, t, g.arti)) return { kotu: true, metin: "Sınıfına ya da levelına uygun değil" };
  const eksik = eksikGereksinim(kat, e, g.arti, karakterStatlari(irk.statlar, t));
  return eksik.length ? { kotu: true, metin: `Gerekli: ${eksik.join(", ")}` } : { kotu: false, metin: null };
}

/** Yuva seçicinin listesi: o yuvaya giren, sınıfın kullanabildiği eşyalar */
export function seciciEsyalari(kat: Katalog, t: Taslak, yuva: number, ara: string, yalnizUygun: boolean): Esya[] {
  const tur = YUVA_TURLERI[yuva], q = kucuk(ara.trim());
  return [...kat.esyalar.values()].filter((e) => e.yuvalar.includes(tur) && kullanabilir(e, t.sinif)
    && (!yalnizUygun || gerekliLevel(kat, e, derecelerOf(kat, e)[0]?.[0] ?? 0) <= t.level)
    && (!q || kucuk(e.ad).includes(q) || kucuk(e.kategori).includes(q)));
}

export const setLevel = (kat: Katalog, st: EsyaSeti) =>
  Math.max(0, ...st.parcalar.map((id) => { const e = kat.esyalar.get(id); return e ? gerekliLevel(kat, e, derecelerOf(kat, e)[0]?.[0] ?? 0) : 0; }));

/** Set seçici: tüm parçaları sınıfa uyan setler, yüksek level önce */
export function seciciSetleri(kat: Katalog, t: Taslak, ara: string, yalnizUygun: boolean): EsyaSeti[] {
  const q = kucuk(ara.trim());
  return [...kat.setler.values()].filter((st) => {
    const p = st.parcalar.map((id) => kat.esyalar.get(id)!).filter(Boolean);
    return p.length && p.every((e) => kullanabilir(e, t.sinif)) && (!yalnizUygun || setLevel(kat, st) <= t.level)
      && (!q || kucuk(st.ad).includes(q) || p.some((e) => kucuk(e.ad).includes(q)));
  }).sort((a, b) => setLevel(kat, b) - setLevel(kat, a) || a.ad.localeCompare(b.ad, "tr"));
}

export const tamSetBonusu = (kat: Katalog, sinif: Sinif, st: EsyaSeti) => setBonusu(kat, sinif, st, 31);

// --- Eşyalar sayfası ---

export const ESYA_GRUPLARI: readonly [string, string, readonly YuvaTuru[]][] = [
  ["silah", "Silah", ["silah"]],
  ["ikinci", "Kalkan", ["ikinci"]],
  ["zirh", "Zırh setleri", SET_YUVALARI],
  ["taki", "Takılar", ["kolye", "kupe", "yuzuk", "kemer"]],
  ["cospre", "Cospre", ["cospre_kask", "cospre_zirh", "cospre_eldiven", "kanat", "dovme", "amblem"]],
];
export const YUVA_TURU_ADI: Record<YuvaTuru, string> = {
  silah: "Silah", ikinci: "İkinci el", kask: "Kask", zirh: "Zırh", pantolon: "Pantolon", eldiven: "Eldiven", bot: "Bot", kolye: "Kolye", kupe: "Küpe",
  yuzuk: "Yüzük", kemer: "Kemer", cospre_kask: "Cospre başlık", cospre_zirh: "Cospre zırh", cospre_eldiven: "Cospre eldiven", kanat: "Kanat", dovme: "Dövme", amblem: "Amblem",
};

export const grubuOf = (e: Esya) => (ESYA_GRUPLARI.find(([, , y]) => e.yuvalar.some((x) => y.includes(x))) ?? ESYA_GRUPLARI[4])[0];

export function katalogListesi(kat: Katalog, sinif: Sinif, ara: string, grup: string, derece: EsyaDerecesi | "") {
  const q = kucuk(ara.trim());
  return [...kat.esyalar.values()].filter((e) => kullanabilir(e, sinif) && (!derece || e.derece === derece)
    && (!q || kucuk(e.ad).includes(q) || kucuk(e.kategori).includes(q)) && (!grup || grubuOf(e) === grup));
}

/** "Rogue, Priest" ya da "Tüm sınıflar" */
export const siniflarMetni = (s: Sinif[], taraf: Taraf) => (s.length && s.length < 5 ? s.map((x) => sinifAdi(x, taraf)).join(", ") : "Tüm sınıflar");

export const sinifEsyaSayisi = (kat: Katalog, sinif: Sinif) => [...kat.esyalar.values()].filter((e) => kullanabilir(e, sinif)).length;

export { YUVA_ADLARI, setOf };

const tamSayi = (n: unknown, a: number, z: number) => typeof n === "number" && Number.isInteger(n) && n >= a && n <= z;

/** Sunucuda kaydetmeden önce: istemciden gelen taslak kurallara ve kataloğa uyuyor mu */
export function taslakDogrula(t: Taslak, irk: Irk, kat: Katalog, k: Kurallar, agacAdlari: readonly string[]): string | null {
  if (!tamSayi(t.level, 1, LEVEL_EN_COK) || !tamSayi(t.reb, 0, REB_EN_COK) || (t.reb && t.level !== LEVEL_EN_COK)) return "Level 1-83, reb yalnızca 83'te";
  if (!t.statlar || STATLAR.some(([s]) => !tamSayi(t.statlar[s], 0, k.statSiniri - irk.statlar[s]))) return `Statlar başlangıç ile ${k.statSiniri} arasında olmalı`;
  if (!Array.isArray(t.skiller) || t.skiller.length !== 4 || t.skiller.some((n) => !tamSayi(n, 0, LEVEL_EN_COK))) return "Skill dağılımı geçersiz";
  const hata = taslakHatasi(t, k, agacAdlari);
  if (hata) return hata;
  for (const [y, g] of Object.entries(t.ekipman ?? {})) {
    const i = Number(y), e = g && kat.esyalar.get(g.itemId);
    if (!tamSayi(i, 0, YUVA_TURLERI.length - 1) || !e || !e.yuvalar.includes(YUVA_TURLERI[i])) return `${YUVA_ADLARI[i] ?? "Yuva"}: eşya bu yuvaya takılamaz`;
    const d = derecelerOf(kat, e);
    if (d.length ? !d.some((r) => r[0] === g.arti) : g.arti !== 0) return `${YUVA_ADLARI[i]}: derece geçersiz`;
  }
  return null;
}

/** İki taslak aynı build mi (kaydedilmemiş değişiklik var mı); ekipman anahtar sırası önemsiz */
export function taslakAyni(a: Taslak, b: Taslak): boolean {
  const ekipman = (t: Taslak) => Object.keys(t.ekipman).sort((x, y) => Number(x) - Number(y)).map((k) => `${k}:${t.ekipman[k].itemId}+${t.ekipman[k].arti}`).join(",");
  return a.sinif === b.sinif && a.irkTuru === b.irkTuru && a.level === b.level && a.reb === b.reb
    && STATLAR.every(([s]) => a.statlar[s] === b.statlar[s]) && a.skiller.every((n, i) => n === b.skiller[i])
    && a.ekler.wes === b.ekler.wes && a.ekler.wolf === b.ekler.wolf && a.ekler.ekStat === b.ekler.ekStat && a.ekler.ekYuzde === b.ekler.ekYuzde
    && ekipman(a) === ekipman(b);
}
