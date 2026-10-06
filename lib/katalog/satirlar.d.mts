import type { Database } from "../database.types";

/** design/katalog.json (scripts/katalog_olustur.py) */
export interface Katalog {
  kaynak: string;
  alanlar: string[];
  esyalar: { id: number; n: string; k: string; s: string[]; c: string[]; i: number | null; g: string; set: string | null; sb?: [string, number]; ef?: string }[];
  dereceler: Record<string, number[][]>;
  setler: { k: string; n: string; p: number[]; a?: string; an?: string }[];
  set_alanlari: string[];
  set_bonuslari: Record<string, Record<string, number[]>>;
  set_kaynak: string;
}

type Satir<T extends keyof Database["public"]["Tables"]> = Omit<Database["public"]["Tables"][T]["Row"], "updated_at">;

export function katalogSatirlari(k: Katalog): {
  items: Satir<"items">[];
  item_stats: Satir<"item_stats">[];
  item_sets: Satir<"item_sets">[];
  item_set_bonuses: Satir<"item_set_bonuses">[];
};
