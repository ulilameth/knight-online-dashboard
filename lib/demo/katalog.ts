// Demo modunun eşya kataloğu: design/katalog.json, supabase/seed.sql ile aynı dönüşümden (lib/katalog/satirlar.mjs).
// Salt okunur ve büyük; süreç başına bir kez kurulur, depoya kopyalanmaz.
import katalogJson from "@/design/katalog.json";
import { katalogSatirlari, type Katalog } from "@/lib/katalog/satirlar.mjs";
import { esya, esyaSeti, setBonusSatiri } from "@/lib/data/ortak";
import type { Esya, EsyaDerecesiSatiri, EsyaSeti, SetBonusSatiri } from "@/lib/types";

export interface DemoKatalog {
  esyalar: Esya[];
  /** eşya kimliği → artıya göre sıralı dereceler */
  dereceler: Map<number, EsyaDerecesiSatiri[]>;
  setler: EsyaSeti[];
  setBonuslari: SetBonusSatiri[];
}

let onbellek: DemoKatalog | undefined;

export function demoKatalog(): DemoKatalog {
  if (onbellek) return onbellek;
  const s = katalogSatirlari(katalogJson as unknown as Katalog);
  const dereceler = new Map<number, EsyaDerecesiSatiri[]>();
  for (const r of s.item_stats) {
    const liste = dereceler.get(r.item_id) ?? [];
    liste.push({ arti: r.arti, degerler: r.degerler as Record<string, number> });
    dereceler.set(r.item_id, liste);
  }
  for (const liste of dereceler.values()) liste.sort((a, b) => a.arti - b.arti);
  onbellek = {
    esyalar: s.items.map((r) => esya({ ...r, updated_at: "" })),
    dereceler,
    setler: s.item_sets.map(esyaSeti),
    setBonuslari: s.item_set_bonuses.map(setBonusSatiri),
  };
  return onbellek;
}
