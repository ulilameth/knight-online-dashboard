// supabase/seed.sql'i design/katalog.json'dan üretir: items, item_stats, item_sets, item_set_bonuses.
// Supabase CLI `db reset` seed.sql'i kendisi çalıştırır; canlı projede SQL Editor'a yapıştırılır (bkz. README).
// Tekrar çalıştırılabilir: KO Bugda kaynaklı satırlar güncellenir, elle eklenen eşyalara (id >= 1.000.000) dokunulmaz.
// Çalıştırma: npm run db:seed
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { katalogSatirlari } from "../lib/katalog/satirlar.mjs";

const KOK = fileURLToPath(new URL("..", import.meta.url));
const katalog = JSON.parse(readFileSync(`${KOK}design/katalog.json`, "utf8"));
const s = katalogSatirlari(katalog);

/** Satır başına bir JSON nesnesi: katalog değişince diff okunur kalır */
const json = (satirlar) => `$katalog$[\n${satirlar.map((x) => JSON.stringify(x)).join(",\n")}\n]$katalog$::jsonb`;

function ekle(tablo, satirlar, sutunlar, anahtar) {
  const ad = sutunlar.map(([a]) => a).join(", ");
  const tanim = sutunlar.map(([a, t]) => `${a} ${t}`).join(", ");
  const guncelle = sutunlar.filter(([a]) => !anahtar.includes(a)).map(([a]) => `${a} = excluded.${a}`).join(", ");
  return `insert into public.${tablo} (${ad})
select ${ad} from jsonb_to_recordset(${json(satirlar)}) as x(${tanim})
on conflict (${anahtar.join(", ")}) do update set ${guncelle};
`;
}

const sql = `-- ÜRETİLDİ, elle düzenlemeyin. Kaynak design/katalog.json, betik scripts/katalog-seed.mjs (npm run db:seed).
-- ${katalog.kaynak}: ${s.items.length} eşya, ${s.item_stats.length} derece satırı, ${s.item_sets.length} set, ${s.item_set_bonuses.length} set bonusu satırı.
-- Set bonusları: ${katalog.set_kaynak}.
begin;

${ekle("item_sets", s.item_sets, [["anahtar", "text"], ["ad", "text"], ["aile", "text"], ["parcalar", "integer[]"], ["bonus_tablosu", "jsonb"]], ["anahtar"])}
${ekle("items", s.items, [["id", "integer"], ["ad", "text"], ["kategori", "text"], ["yuvalar", "text[]"], ["siniflar", "public.sinif[]"], ["derece", "public.esya_derecesi"], ["set_anahtari", "text"], ["set_parcasi", "jsonb"], ["etki", "text"], ["gorsel", "text"], ["kaynak", "text"]], ["id"])}
${ekle("item_stats", s.item_stats, [["item_id", "integer"], ["arti", "smallint"], ["degerler", "jsonb"]], ["item_id", "arti"])}
${ekle("item_set_bonuses", s.item_set_bonuses, [["tablo", "text"], ["maske", "smallint"], ["bonus", "jsonb"]], ["tablo", "maske"])}
commit;
`;
writeFileSync(`${KOK}supabase/seed.sql`, sql);
console.log(`supabase/seed.sql yazıldı (${s.items.length} eşya, ${s.item_stats.length} derece)`);
