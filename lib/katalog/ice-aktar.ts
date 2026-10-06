// Ayarlar › Eşya kataloğu: elle girilen ya da JSON/CSV ile içe aktarılan eşyanın doğrulanması ve ayrıştırılması.
// Saf fonksiyonlar; veri katmanı (lib/data/items.ts) kaydetmeden önce esyaDogrula'yı çağırır.
import { MAX_ARTI, YUVALAR } from "@/lib/rules/build";
import type { EsyaDerecesi, EsyaDerecesiSatiri, Sinif } from "@/lib/types";

/** Elle eklenen eşyaların kimliği buradan başlar (KO Bugda kimlikleri bunun altında) */
export const ELLE_ESYA_BASLANGIC = 1_000_000;

export interface EsyaGirdisi {
  /** Verilmezse yeni elle eşya; verilirse o eşya güncellenir ya da o kimlikle eklenir */
  id?: number;
  ad: string;
  kategori: string;
  yuvalar: string[];
  /** Boş: tüm sınıflar */
  siniflar: Sinif[];
  derece: EsyaDerecesi;
  etki?: string | null;
  gorsel?: string | null;
  /** Verilirse eşyanın derece satırlarının yerini alır; verilmezse mevcutlara dokunulmaz */
  dereceler?: EsyaDerecesiSatiri[];
}

const SINIFLAR: readonly Sinif[] = ["warrior", "rogue", "mage", "priest", "kurian"];
const DERECELER: readonly EsyaDerecesi[] = ["normal", "set", "unique", "rare", "draki", "cospre"];
const YUVA_KUMESI = new Set<string>(YUVALAR);
/** Değer alanı adı: KO Bugda biçimi (AttackPower, BonusStrength …) */
const ALAN_ADI = /^[A-Za-z][A-Za-z0-9]{0,39}$/;

/** Girdiyi denetler ve temizler (boşlukları kırpar, tekrarları atar); hatalar Türkçe listelenir */
export function esyaDogrula(g: EsyaGirdisi): { esya: EsyaGirdisi; hatalar: string[] } {
  const hatalar: string[] = [];
  const ad = String(g.ad ?? "").trim();
  const kategori = String(g.kategori ?? "").trim();
  if (!ad || ad.length > 80) hatalar.push("Ad 1-80 karakter olmalı");
  if (!kategori || kategori.length > 60) hatalar.push("Kategori 1-60 karakter olmalı");
  if (g.id !== undefined && (!Number.isInteger(g.id) || g.id < 1)) hatalar.push("Kimlik pozitif tam sayı olmalı");
  const yuvalar = [...new Set((g.yuvalar ?? []).map((y) => String(y).trim()))];
  if (!yuvalar.length) hatalar.push("En az bir yuva seçilmeli");
  const bilinmeyen = yuvalar.filter((y) => !YUVA_KUMESI.has(y));
  if (bilinmeyen.length) hatalar.push(`Bilinmeyen yuva: ${bilinmeyen.join(", ")}`);
  const siniflar = [...new Set(g.siniflar ?? [])];
  const yanlisSinif = siniflar.filter((s) => !SINIFLAR.includes(s));
  if (yanlisSinif.length) hatalar.push(`Bilinmeyen sınıf: ${yanlisSinif.join(", ")}`);
  if (!DERECELER.includes(g.derece)) hatalar.push(`Derece ${DERECELER.join(", ")} olmalı`);
  const etki = g.etki?.trim() || null;
  if (etki && etki.length > 200) hatalar.push("Etki en fazla 200 karakter");
  const gorsel = g.gorsel?.trim() || null;
  if (gorsel && gorsel.length > 500) hatalar.push("Görsel adresi en fazla 500 karakter");

  let dereceler: EsyaDerecesiSatiri[] | undefined;
  if (g.dereceler !== undefined) {
    const artilar = new Set<number>();
    dereceler = [];
    for (const d of g.dereceler) {
      if (!Number.isInteger(d.arti) || d.arti < 0 || d.arti > MAX_ARTI) { hatalar.push(`Artı 0 ile ${MAX_ARTI} arası olmalı (${d.arti})`); continue; }
      if (artilar.has(d.arti)) { hatalar.push(`+${d.arti} iki kez verilmiş`); continue; }
      artilar.add(d.arti);
      const degerler: Record<string, number> = {};
      for (const [alan, v] of Object.entries(d.degerler ?? {})) {
        if (!ALAN_ADI.test(alan)) { hatalar.push(`+${d.arti}: geçersiz alan adı "${alan}"`); continue; }
        if (typeof v !== "number" || !Number.isInteger(v) || Math.abs(v) > 100_000) { hatalar.push(`+${d.arti} ${alan}: tam sayı olmalı`); continue; }
        if (v) degerler[alan] = v;
      }
      dereceler.push({ arti: d.arti, degerler });
    }
    dereceler.sort((a, b) => a.arti - b.arti);
  }
  return { esya: { ...(g.id !== undefined && { id: g.id }), ad, kategori, yuvalar, siniflar, derece: g.derece, etki, gorsel, ...(dereceler && { dereceler }) }, hatalar };
}

export interface AyristirmaSonucu {
  esyalar: EsyaGirdisi[];
  /** "Satır 4: ..." / "Eşya 2: ..." biçiminde; boşsa hepsi geçerli */
  hatalar: string[];
}

const liste = (s: unknown) => String(s ?? "").split(/[|,;]/).map((x) => x.trim()).filter(Boolean);

/**
 * JSON: dizi ya da {esyalar: [...]}; her öğe EsyaGirdisi (yuvalar/siniflar dizi ya da "a|b" metni).
 * kobugda.com/api/items yanıtı bu biçimde değil; o yanıtlar scripts/katalog_olustur.py ile kataloğa katılır.
 */
export function jsonAyristir(metin: string): AyristirmaSonucu {
  let veri: unknown;
  try { veri = JSON.parse(metin); } catch { return { esyalar: [], hatalar: ["Geçerli JSON değil"] }; }
  const dizi = Array.isArray(veri) ? veri : (veri as { esyalar?: unknown })?.esyalar;
  if (!Array.isArray(dizi)) return { esyalar: [], hatalar: ["JSON bir dizi ya da {\"esyalar\": [...]} olmalı"] };
  const esyalar: EsyaGirdisi[] = [];
  const hatalar: string[] = [];
  dizi.forEach((x: Record<string, unknown>, i) => {
    if (!x || typeof x !== "object") { hatalar.push(`Eşya ${i + 1}: nesne olmalı`); return; }
    const g: EsyaGirdisi = {
      ...(x.id !== undefined && x.id !== null && { id: Number(x.id) }),
      ad: String(x.ad ?? ""), kategori: String(x.kategori ?? ""),
      yuvalar: Array.isArray(x.yuvalar) ? x.yuvalar.map(String) : liste(x.yuvalar),
      siniflar: (Array.isArray(x.siniflar) ? x.siniflar.map(String) : liste(x.siniflar)) as Sinif[],
      derece: String(x.derece ?? "normal") as EsyaDerecesi,
      etki: x.etki == null ? null : String(x.etki), gorsel: x.gorsel == null ? null : String(x.gorsel),
      ...(Array.isArray(x.dereceler) && { dereceler: x.dereceler as EsyaDerecesiSatiri[] }),
    };
    const d = esyaDogrula(g);
    if (d.hatalar.length) hatalar.push(...d.hatalar.map((h) => `Eşya ${i + 1}: ${h}`));
    else esyalar.push(d.esya);
  });
  return { esyalar, hatalar };
}

/** RFC 4180 CSV satırları (tırnak içinde virgül ve "" kaçışı); ayraç virgül ya da noktalı virgül (Türkçe Excel) */
function csvSatirlari(metin: string): string[][] {
  const ilk = metin.split(/\r?\n/, 1)[0] ?? "";
  const ayrac = (ilk.match(/;/g)?.length ?? 0) > (ilk.match(/,/g)?.length ?? 0) ? ";" : ",";
  const satirlar: string[][] = [];
  let satir: string[] = [];
  let hucre = "";
  let tirnak = false;
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (tirnak) {
      if (c === '"' && metin[i + 1] === '"') { hucre += '"'; i++; }
      else if (c === '"') tirnak = false;
      else hucre += c;
    } else if (c === '"') tirnak = true;
    else if (c === ayrac) { satir.push(hucre); hucre = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && metin[i + 1] === "\n") i++;
      satir.push(hucre); satirlar.push(satir); satir = []; hucre = "";
    } else hucre += c;
  }
  if (hucre || satir.length) { satir.push(hucre); satirlar.push(satir); }
  return satirlar.filter((s) => s.some((h) => h.trim()));
}

const CSV_SABIT = ["id", "ad", "kategori", "yuvalar", "siniflar", "derece", "etki", "gorsel", "arti"] as const;

/**
 * CSV: başlık satırı zorunlu. Sütunlar: ad, kategori, yuvalar, siniflar, derece (zorunlu; liste sütunlarında ayraç "|"),
 * id, etki, gorsel, arti (isteğe bağlı) ve diğer her sütun bir değer alanı (AttackPower, Defense, RequiredLevel …).
 * Aynı eşyanın her artısı ayrı satır (id ya da ad ile birleşir); arti sütunu yoksa değer alanları yok sayılır.
 */
export function csvAyristir(metin: string): AyristirmaSonucu {
  const satirlar = csvSatirlari(metin.replace(/^﻿/, ""));
  if (satirlar.length < 2) return { esyalar: [], hatalar: ["CSV'de başlık ve en az bir satır olmalı"] };
  const baslik = satirlar[0].map((h) => h.trim());
  const eksik = ["ad", "kategori", "yuvalar", "siniflar", "derece"].filter((s) => !baslik.includes(s));
  if (eksik.length) return { esyalar: [], hatalar: [`Eksik sütun: ${eksik.join(", ")}`] };
  const degerSutunlari = baslik.filter((h) => !(CSV_SABIT as readonly string[]).includes(h));
  const artiVar = baslik.includes("arti");

  const hatalar: string[] = [];
  const gruplar = new Map<string, { g: EsyaGirdisi; satir: number }>();
  satirlar.slice(1).forEach((hucreler, i) => {
    const no = i + 2;
    const h = (ad: string) => (hucreler[baslik.indexOf(ad)] ?? "").trim();
    const anahtar = h("id") || `ad:${h("ad").toLocaleLowerCase("tr")}`;
    let grup = gruplar.get(anahtar);
    if (!grup) {
      grup = { satir: no, g: {
        ...(h("id") && { id: Number(h("id")) }),
        ad: h("ad"), kategori: h("kategori"), yuvalar: liste(h("yuvalar")), siniflar: liste(h("siniflar")) as Sinif[],
        derece: (h("derece") || "normal") as EsyaDerecesi, etki: h("etki") || null, gorsel: h("gorsel") || null,
        ...(artiVar && { dereceler: [] }),
      } };
      gruplar.set(anahtar, grup);
    }
    if (!artiVar || !h("arti")) return;
    const degerler: Record<string, number> = {};
    for (const s of degerSutunlari) {
      const v = h(s);
      if (!v) continue;
      const n = Number(v.replace(",", "."));
      if (!Number.isFinite(n)) { hatalar.push(`Satır ${no}: ${s} sayı değil ("${v}")`); continue; }
      degerler[s] = n;
    }
    grup.g.dereceler!.push({ arti: Number(h("arti")), degerler });
  });

  const esyalar: EsyaGirdisi[] = [];
  for (const { g, satir } of gruplar.values()) {
    const d = esyaDogrula(g);
    if (d.hatalar.length) hatalar.push(...d.hatalar.map((x) => `Satır ${satir}: ${x}`));
    else esyalar.push(d.esya);
  }
  return { esyalar, hatalar };
}
