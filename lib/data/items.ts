// Karakter tasarımı: oyun kuralları (game_rules, race_stats, class_trees) ve eşya kataloğu (items, item_stats, item_sets).
// Üyeler okur; yetkili eşya ekler, düzenler, siler ve içe aktarır (Ayarlar › Eşya kataloğu).
// Katalog supabase/seed.sql'den (demo modunda design/katalog.json'dan) gelir.
import type { PostgrestError } from "@supabase/supabase-js";
import { agaclar, irklar, oyunKuralSatirlari } from "@/lib/demo/fixtures";
import { demoKatalog } from "@/lib/demo/katalog";
import { GORSEL_KOVASI, GORSEL_MIME, gorselDenetle, gorselYolu, kovaYolu } from "@/lib/katalog/gorsel";
import { ELLE_ESYA_BASLANGIC, type EsyaGirdisi, esyaDogrula } from "@/lib/katalog/ice-aktar";
import { type OyunKurallari, kurallariCoz } from "@/lib/rules/kurallar";
import type { Esya, EsyaDetayi, EsyaSeti, IrkStatlari, SetBonusSatiri, Sinif } from "@/lib/types";
import {
  type Db, type DemoBaglam, VeriHatasi, calistir, demoYetki, esya, esyaSeti, irkStatlari, setBonusSatiri, sorgu,
} from "./ortak";

export interface KarakterKurallari {
  oyun: OyunKurallari;
  irklar: IrkStatlari[];
  /** Sınıf → 3 ağaç + master adı */
  agaclar: Record<Sinif, string[]>;
}

export interface EsyaFiltresi {
  /** Yalnızca bu sınıfın kullanabildikleri (sınıfsız eşyalar dahil) */
  sinif?: Sinif;
  /** Yalnızca bu yuvaya takılanlar (kask, silah, cospre_kask …) */
  yuva?: string;
  /** Adda geçen metin (büyük/küçük harf duyarsız) */
  ara?: string;
}

export interface KatalogVerisi {
  kurallar(): Promise<KarakterKurallari>;
  /** Eşya listesi (derece satırları olmadan), kimliğe göre sıralı */
  esyalar(f?: EsyaFiltresi): Promise<Esya[]>;
  /** Eşya ve tüm artı seviyeleri */
  esya(id: number): Promise<EsyaDetayi | null>;
  /** Birden çok eşya dereceleriyle (build denetimi); katalogda olmayan kimlik haritada yer almaz */
  esyaDetaylari(ids: number[]): Promise<Map<number, EsyaDetayi>>;
  setler(): Promise<EsyaSeti[]>;
  /** Eski KO Bugda aile tabloları */
  setBonuslari(): Promise<SetBonusSatiri[]>;
  /** Yetkili. id yoksa yeni elle eşya (1.000.000+); dereceler verilirse eşyanın tüm derece satırlarının yerini alır */
  esyaKaydet(g: EsyaGirdisi): Promise<EsyaDetayi>;
  /** Yetkili; yalnızca elle eklenen eşyalar (KO Bugda eşyaları seed'le geri gelir) */
  esyaSil(id: number): Promise<void>;
  /** Yetkili; JSON/CSV ayrıştırıcısının (lib/katalog/ice-aktar.ts) çıktısı. Biri doğrulamadan geçmezse hiçbiri yazılmaz. */
  iceAktar(esyalar: EsyaGirdisi[]): Promise<{ eklenen: number; guncellenen: number }>;
  /** Yetkili; PNG/JPEG/WebP/GIF, en fazla 256 KB (lib/katalog/gorsel.ts). Önceki yüklenen görsel silinir. */
  esyaGorseliYukle(id: number, dosya: Uint8Array): Promise<EsyaDetayi>;
  /** Yetkili; yüklenen görseli siler, eşya görselsiz kalır */
  esyaGorseliKaldir(id: number): Promise<EsyaDetayi>;
}

function gorselDosyasi(dosya: Uint8Array) {
  const d = gorselDenetle(dosya);
  if ("hata" in d) throw new VeriHatasi(d.hata);
  return d.tur;
}
const ESYA_YOK = "Eşya bulunamadı";

function denetle(g: EsyaGirdisi): EsyaGirdisi {
  const d = esyaDogrula(g);
  if (d.hatalar.length) throw new VeriHatasi(d.hatalar.join(" · "));
  return d.esya;
}

const yeniEsya = (id: number, g: EsyaGirdisi, eski?: EsyaDetayi): EsyaDetayi => ({
  id, ad: g.ad, kategori: g.kategori, yuvalar: g.yuvalar, siniflar: g.siniflar, derece: g.derece,
  setAnahtari: eski?.setAnahtari ?? null, setParcasi: eski?.setParcasi ?? null, etki: g.etki ?? null, gorsel: g.gorsel ?? null,
  kaynak: eski?.kaynak ?? "elle", dereceler: g.dereceler ?? eski?.dereceler ?? [],
});

/** Arama için: eşya adları İngilizce ("Knight"), kullanıcı Türkçe klavyede yazar; I/ı/İ/i aynı sayılır */
const kucuk = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i");

function filtrele(e: Esya, f: EsyaFiltresi = {}) {
  if (f.sinif && e.siniflar.length && !e.siniflar.includes(f.sinif)) return false;
  if (f.yuva && !e.yuvalar.includes(f.yuva)) return false;
  if (f.ara?.trim() && !kucuk(e.ad).includes(kucuk(f.ara.trim()))) return false;
  return true;
}

export function demoKatalogVerisi(b: DemoBaglam): KatalogVerisi {
  const d = b.depo;
  const katalog = () => demoKatalog();
  /** Salt okunur katalog + bu depodaki eklemeler, düzenlemeler ve silmeler */
  function tumu(): EsyaDetayi[] {
    const temel = katalog().esyalar
      .filter((e) => !d.silinenEsyalar.has(e.id) && !d.esyaDegisiklikleri.has(e.id))
      .map((e) => ({ ...e, dereceler: katalog().dereceler.get(e.id) ?? [] }));
    return [...temel, ...d.esyaDegisiklikleri.values()].sort((x, y) => x.id - y.id);
  }
  const bul = (id: number) => tumu().find((e) => e.id === id);
  function kaydet(g: EsyaGirdisi): { esya: EsyaDetayi; yeni: boolean } {
    const eski = g.id !== undefined ? bul(g.id) : undefined;
    const id = g.id ?? Math.max(ELLE_ESYA_BASLANGIC - 1, ...tumu().map((e) => e.id)) + 1;
    const yeni = yeniEsya(id, g, eski);
    d.esyaDegisiklikleri.set(id, yeni);
    d.silinenEsyalar.delete(id);
    return { esya: structuredClone(yeni), yeni: !eski };
  }
  return {
    async kurallar() {
      demoYetki(b, "uye");
      return { oyun: kurallariCoz(oyunKuralSatirlari), irklar: structuredClone(irklar), agaclar: structuredClone(agaclar) };
    },
    async esyalar(f) {
      demoYetki(b, "uye");
      return tumu().filter((e) => filtrele(e, f)).map((e) => {
        const kopya: Esya & { dereceler?: unknown } = structuredClone(e);
        delete kopya.dereceler;
        return kopya;
      });
    },
    async esya(id) {
      demoYetki(b, "uye");
      const e = bul(id);
      return e ? structuredClone(e) : null;
    },
    async esyaDetaylari(ids) {
      demoYetki(b, "uye");
      const istenen = new Set(ids);
      return new Map(tumu().filter((e) => istenen.has(e.id)).map((e) => [e.id, structuredClone(e)]));
    },
    async setler() { demoYetki(b, "uye"); return structuredClone(katalog().setler); },
    async setBonuslari() { demoYetki(b, "uye"); return structuredClone(katalog().setBonuslari); },
    async esyaKaydet(g) {
      demoYetki(b, "yetkili");
      return kaydet(denetle(g)).esya;
    },
    async esyaSil(id) {
      demoYetki(b, "yetkili");
      if (id < ELLE_ESYA_BASLANGIC) throw new VeriHatasi("KO Bugda eşyaları silinmez; düzenlenebilir");
      d.esyaDegisiklikleri.delete(id);
      d.silinenEsyalar.add(id);
    },
    async iceAktar(esyalar) {
      demoYetki(b, "yetkili");
      const temiz = esyalar.map(denetle);
      let eklenen = 0;
      for (const g of temiz) if (kaydet(g).yeni) eklenen++;
      return { eklenen, guncellenen: temiz.length - eklenen };
    },
    async esyaGorseliYukle(id, dosya) {
      demoYetki(b, "yetkili");
      const tur = gorselDosyasi(dosya);
      const e = bul(id);
      if (!e) throw new VeriHatasi(ESYA_YOK);
      // Demo modunda depolama yok: görsel adresin kendisinde
      const gorsel = `data:${GORSEL_MIME[tur]};base64,${Buffer.from(dosya).toString("base64")}`;
      d.esyaDegisiklikleri.set(id, { ...e, gorsel });
      return structuredClone({ ...e, gorsel });
    },
    async esyaGorseliKaldir(id) {
      demoYetki(b, "yetkili");
      const e = bul(id);
      if (!e) throw new VeriHatasi(ESYA_YOK);
      d.esyaDegisiklikleri.set(id, { ...e, gorsel: null });
      return structuredClone({ ...e, gorsel: null });
    },
  };
}

/** PostgREST bir yanıtta en fazla max-rows (Supabase'de 1000) satır döner; sayfa sayfa okur */
async function tumu<T>(sayfa: (bas: number, son: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>) {
  const BOYUT = 1000;
  const out: T[] = [];
  for (let bas = 0; ; bas += BOYUT) {
    const r = await sorgu(sayfa(bas, bas + BOYUT - 1));
    out.push(...r);
    if (r.length < BOYUT) return out;
  }
}

export function supabaseKatalogVerisi(db: Db): KatalogVerisi {
  const kova = db.storage.from(GORSEL_KOVASI);
  async function detaylar(ids: number[]) {
    const out = new Map<number, EsyaDetayi>();
    if (!ids.length) return out;
    const [esyalar, dereceler] = await Promise.all([
      sorgu(db.from("items").select("*").in("id", ids)),
      tumu((bas, son) => db.from("item_stats").select("*").in("item_id", ids).order("item_id").order("arti").range(bas, son)),
    ]);
    for (const r of esyalar) out.set(r.id, { ...esya(r), dereceler: [] });
    for (const d of dereceler) out.get(d.item_id)?.dereceler.push({ arti: d.arti, degerler: d.degerler as Record<string, number> });
    return out;
  }
  return {
    async kurallar() {
      const [kurallar, irkSatirlari, agacSatirlari] = await Promise.all([
        sorgu(db.from("game_rules").select("anahtar, deger, dogrulandi")),
        sorgu(db.from("race_stats").select("*").order("taraf").order("irk_turu")),
        sorgu(db.from("class_trees").select("*").order("sinif").order("sira")),
      ]);
      const agaclar = { warrior: [], rogue: [], mage: [], priest: [], kurian: [] } as Record<Sinif, string[]>;
      for (const a of agacSatirlari) agaclar[a.sinif][a.sira - 1] = a.ad;
      return { oyun: kurallariCoz(kurallar), irklar: irkSatirlari.map(irkStatlari), agaclar };
    },
    async esyalar(f = {}) {
      const satirlar = await tumu((bas, son) => {
        let q = db.from("items").select("*").order("id").range(bas, son);
        if (f.sinif) q = q.or(`siniflar.eq.{},siniflar.cs.{${f.sinif}}`);
        if (f.yuva) q = q.contains("yuvalar", [f.yuva]);
        return q;
      });
      // Ad araması burada: ilike I/ı/İ/i'yi eşlemez; katalog küçük
      return satirlar.map(esya).filter((e) => filtrele(e, { ara: f.ara }));
    },
    async esya(id) { return (await detaylar([id])).get(id) ?? null; },
    esyaDetaylari: (ids) => detaylar([...new Set(ids)]),
    async setler() { return (await tumu((bas, son) => db.from("item_sets").select("*").order("ad").range(bas, son))).map(esyaSeti); },
    async setBonuslari() {
      return (await tumu((bas, son) => db.from("item_set_bonuses").select("*").order("tablo").order("maske").range(bas, son))).map(setBonusSatiri);
    },
    async esyaKaydet(g) {
      return (await yaz(denetle(g))).esya;
    },
    async esyaSil(id) {
      if (id < ELLE_ESYA_BASLANGIC) throw new VeriHatasi("KO Bugda eşyaları silinmez; düzenlenebilir");
      const r = await sorgu(db.from("items").delete().eq("id", id).select("id"));
      if (!r.length) throw new VeriHatasi("Eşya bulunamadı ya da bu işlem için yetkin yok");
    },
    async iceAktar(esyalar) {
      const temiz = esyalar.map(denetle);
      let eklenen = 0;
      for (const g of temiz) if ((await yaz(g)).yeni) eklenen++;
      return { eklenen, guncellenen: temiz.length - eklenen };
    },
    async esyaGorseliYukle(id, dosya) {
      const tur = gorselDosyasi(dosya);
      const eski = (await detaylar([id])).get(id);
      if (!eski) throw new VeriHatasi(ESYA_YOK);
      const yol = gorselYolu(id, tur);
      const { error } = await kova.upload(yol, dosya, { contentType: GORSEL_MIME[tur], cacheControl: "31536000", upsert: false });
      if (error) throw new VeriHatasi(`Görsel yüklenemedi: ${error.message}`);
      try {
        await gorselYaz(id, kova.getPublicUrl(yol).data.publicUrl);
      } catch (hata) {
        await kova.remove([yol]);
        throw hata;
      }
      await eskiyiSil(eski.gorsel);
      return (await detaylar([id])).get(id)!;
    },
    async esyaGorseliKaldir(id) {
      const eski = (await detaylar([id])).get(id);
      if (!eski) throw new VeriHatasi(ESYA_YOK);
      await gorselYaz(id, null);
      await eskiyiSil(eski.gorsel);
      return (await detaylar([id])).get(id)!;
    },
  };

  async function gorselYaz(id: number, gorsel: string | null) {
    const r = await sorgu(db.from("items").update({ gorsel }).eq("id", id).select("id"));
    if (!r.length) throw new VeriHatasi("Eşya bulunamadı ya da bu işlem için yetkin yok");
  }

  /** Yalnızca bu kovaya yüklenmiş görsel; KO Bugda dosya adına dokunulmaz. Silinemezse kova çöpü kalır, işlem bozulmaz. */
  async function eskiyiSil(gorsel: string | null) {
    const yol = kovaYolu(gorsel, kova.getPublicUrl("").data.publicUrl);
    if (yol) await kova.remove([yol]);
  }

  async function yaz(g: EsyaGirdisi): Promise<{ esya: EsyaDetayi; yeni: boolean }> {
    const eski = g.id !== undefined ? (await detaylar([g.id])).get(g.id) : undefined;
    let id = g.id;
    if (id === undefined) {
      const enBuyuk = await sorgu(db.from("items").select("id").gte("id", ELLE_ESYA_BASLANGIC).order("id", { ascending: false }).limit(1));
      id = Math.max(ELLE_ESYA_BASLANGIC - 1, enBuyuk[0]?.id ?? 0) + 1;
    }
    const e = yeniEsya(id, g, eski);
    const satir = {
      id, ad: e.ad, kategori: e.kategori, yuvalar: e.yuvalar, siniflar: e.siniflar, derece: e.derece, etki: e.etki, gorsel: e.gorsel,
      kaynak: e.kaynak,
    };
    await calistir(db.from("items").upsert(satir));
    if (g.dereceler) {
      // Önce yenileri yaz, sonra listede olmayanları sil: yarıda kalırsa eski dereceler kaybolmaz
      if (g.dereceler.length) {
        await calistir(db.from("item_stats").upsert(g.dereceler.map((x) => ({ item_id: id, arti: x.arti, degerler: x.degerler }))));
      }
      const kalan = g.dereceler.map((x) => x.arti);
      let sil = db.from("item_stats").delete().eq("item_id", id);
      if (kalan.length) sil = sil.not("arti", "in", `(${kalan.join(",")})`);
      await calistir(sil);
    }
    return { esya: (await detaylar([id])).get(id) ?? e, yeni: !eski };
  }
}
