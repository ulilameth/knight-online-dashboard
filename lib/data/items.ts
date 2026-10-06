// Karakter tasarımı: oyun kuralları (game_rules, race_stats, class_trees) ve eşya kataloğu (items, item_stats, item_sets).
// Hepsi üyelere salt okunur; katalog supabase/seed.sql'den (demo modunda design/katalog.json'dan) gelir.
import type { PostgrestError } from "@supabase/supabase-js";
import { agaclar, irklar, oyunKuralSatirlari } from "@/lib/demo/fixtures";
import { demoKatalog } from "@/lib/demo/katalog";
import { type OyunKurallari, kurallariCoz } from "@/lib/rules/kurallar";
import type { Esya, EsyaDetayi, EsyaSeti, IrkStatlari, SetBonusSatiri, Sinif } from "@/lib/types";
import { type Db, type DemoBaglam, demoYetki, esya, esyaSeti, irkStatlari, setBonusSatiri, sorgu } from "./ortak";

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
}

/** Arama için: eşya adları İngilizce ("Knight"), kullanıcı Türkçe klavyede yazar; I/ı/İ/i aynı sayılır */
const kucuk = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i");

function filtrele(e: Esya, f: EsyaFiltresi = {}) {
  if (f.sinif && e.siniflar.length && !e.siniflar.includes(f.sinif)) return false;
  if (f.yuva && !e.yuvalar.includes(f.yuva)) return false;
  if (f.ara?.trim() && !kucuk(e.ad).includes(kucuk(f.ara.trim()))) return false;
  return true;
}

export function demoKatalogVerisi(b: DemoBaglam): KatalogVerisi {
  const detay = (e: Esya): EsyaDetayi => structuredClone({ ...e, dereceler: demoKatalog().dereceler.get(e.id) ?? [] });
  return {
    async kurallar() {
      demoYetki(b, "uye");
      return { oyun: kurallariCoz(oyunKuralSatirlari), irklar: structuredClone(irklar), agaclar: structuredClone(agaclar) };
    },
    async esyalar(f) {
      demoYetki(b, "uye");
      return demoKatalog().esyalar.filter((e) => filtrele(e, f)).sort((x, y) => x.id - y.id).map((e) => structuredClone(e));
    },
    async esya(id) {
      demoYetki(b, "uye");
      const e = demoKatalog().esyalar.find((x) => x.id === id);
      return e ? detay(e) : null;
    },
    async esyaDetaylari(ids) {
      demoYetki(b, "uye");
      const istenen = new Set(ids);
      return new Map(demoKatalog().esyalar.filter((e) => istenen.has(e.id)).map((e) => [e.id, detay(e)]));
    },
    async setler() { demoYetki(b, "uye"); return structuredClone(demoKatalog().setler); },
    async setBonuslari() { demoYetki(b, "uye"); return structuredClone(demoKatalog().setBonuslari); },
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
  };
}
