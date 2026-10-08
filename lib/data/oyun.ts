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
  };
}

export function supabaseOyun(db: Db): OyunVerisi {
  return {
    async irklar() {
      const r = await sorgu(db.from("race_stats").select("*").order("irk_turu"));
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
  };
}
