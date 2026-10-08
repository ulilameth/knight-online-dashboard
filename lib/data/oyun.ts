// Karakter tasarımının oyun verisi: ırk başlangıç statları, skill ağaçları ve kurallar (game_rules).
import { agaclar as demoAgaclar, irklar as demoIrklar } from "@/lib/demo/fixtures";
import { type Kurallar, VARSAYILAN_KURALLAR, kurallariOku } from "@/lib/oyun/hesap";
import type { Irk, Sinif, Taraf } from "@/lib/types";
import { type Db, type DemoBaglam, demoYetki, sorgu } from "./ortak";

export type Agaclar = Record<Sinif, [string, string, string, string]>;

export interface OyunVerisi {
  irklar(): Promise<Irk[]>;
  agaclar(): Promise<Agaclar>;
  kurallar(): Promise<Kurallar>;
  /** game_rules'ta "doğrulanacak" işaretli anahtarlar (kural tablosunda etiketlenir) */
  dogrulanmamisKurallar(): Promise<string[]>;
}

/** Sınıfın bu taraftaki ırkları; kayıtlı ırk yoksa ya da bu tarafta değilse ilki */
export const irkSecenekleri = (irklar: Irk[], sinif: Sinif, taraf: Taraf) => irklar.filter((r) => r.taraf === taraf && r.siniflar.includes(sinif));
export function irkBul(irklar: Irk[], sinif: Sinif, taraf: Taraf, irkTuru: string | null): Irk {
  const secenek = irkSecenekleri(irklar, sinif, taraf);
  return secenek.find((r) => r.irkTuru === irkTuru) ?? secenek[0] ?? irklar.find((r) => r.siniflar.includes(sinif))!;
}

export function demoOyun(b: DemoBaglam): OyunVerisi {
  return {
    async irklar() { demoYetki(b, "uye"); return structuredClone(demoIrklar); },
    async agaclar() { demoYetki(b, "uye"); return structuredClone(demoAgaclar); },
    async kurallar() { demoYetki(b, "uye"); return VARSAYILAN_KURALLAR; },
    async dogrulanmamisKurallar() { demoYetki(b, "uye"); return ["master_level", "master_max"]; },
  };
}

export function supabaseOyun(db: Db): OyunVerisi {
  return {
    async irklar() {
      // Demo ile aynı sıra: sınıfın varsayılan ırkı ilk sıradaki
      const sira = (t: string) => { const i = demoIrklar.findIndex((x) => x.irkTuru === t); return i < 0 ? 999 : i; };
      const r = (await sorgu(db.from("race_stats").select("*"))).sort((a, b) => sira(a.irk_turu) - sira(b.irk_turu) || a.irk_turu.localeCompare(b.irk_turu));
      return r.map((x) => ({ irkTuru: x.irk_turu, ad: x.ad, taraf: x.taraf, siniflar: x.siniflar, statlar: { str: x.str, hp: x.hp, dex: x.dex, int: x.int, mp: x.mp } }));
    },
    async agaclar() {
      const r = await sorgu(db.from("class_trees").select("*").order("sira"));
      const sonuc = structuredClone(demoAgaclar);
      for (const x of r) sonuc[x.sinif][x.sira - 1] = x.ad;
      return sonuc;
    },
    async kurallar() {
      const r = await sorgu(db.from("game_rules").select("anahtar, deger"));
      return r.length ? kurallariOku(r) : VARSAYILAN_KURALLAR;
    },
    async dogrulanmamisKurallar() {
      return (await sorgu(db.from("game_rules").select("anahtar").eq("dogrulandi", false))).map((x) => x.anahtar);
    },
  };
}
