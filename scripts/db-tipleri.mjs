// lib/database.types.ts'i migration'dan üretir (Supabase CLI'nin `gen types typescript` biçiminde).
// Geçici bir veritabanı açar, Supabase taklidini ve migration'ları uygular, public şemasını okur.
// Çalıştırma: DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run db:tipler
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const KOK = fileURLToPath(new URL("..", import.meta.url));
const ADRES = process.env.DATABASE_URL;
if (!ADRES) throw new Error("DATABASE_URL gerekli");

const ad = `l4bel_tip_${process.pid}`;
const yonetim = new pg.Client({ connectionString: ADRES });
await yonetim.connect();
await yonetim.query(`create database ${ad}`);
const url = new URL(ADRES);
url.pathname = `/${ad}`;
const db = new pg.Client({ connectionString: url.toString() });

try {
  await db.connect();
  await db.query(readFileSync(`${KOK}supabase/tests/supabase-stub.sql`, "utf8"));
  for (const dosya of readdirSync(`${KOK}supabase/migrations`).sort()) {
    await db.query(readFileSync(`${KOK}supabase/migrations/${dosya}`, "utf8"));
  }
  writeFileSync(`${KOK}lib/database.types.ts`, await uret());
  console.log("lib/database.types.ts yazıldı");
} finally {
  await db.end();
  await yonetim.query(`drop database if exists ${ad} with (force)`);
  await yonetim.end();
}

async function uret() {
  const enumlar = (await db.query(`
    select t.typname as ad, array_agg(e.enumlabel::text order by e.enumsortorder) as degerler
    from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' group by t.typname order by t.typname`)).rows;
  const enumAdlari = new Set(enumlar.map((e) => e.ad));

  const tsTipi = (udt, dizi = false) => {
    if (dizi) return `${tsTipi(udt.replace(/^_/, ""))}[]`;
    if (enumAdlari.has(udt)) return `Database["public"]["Enums"]["${udt}"]`;
    if (["int2", "int4", "int8", "float4", "float8", "numeric"].includes(udt)) return "number";
    if (udt === "bool") return "boolean";
    if (udt === "json" || udt === "jsonb") return "Json";
    return "string";
  };

  const sutunlar = (await db.query(`
    select c.table_name as tablo, c.column_name as ad, c.udt_name as udt, c.data_type = 'ARRAY' as dizi,
           c.is_nullable = 'YES' as bos, (c.column_default is not null or c.is_identity = 'YES') as varsayilan,
           c.is_identity = 'YES' and c.identity_generation = 'ALWAYS' as hep_uretilir
    from information_schema.columns c join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    order by c.table_name, c.ordinal_position`)).rows;
  const tablolar = new Map();
  for (const s of sutunlar) {
    if (!tablolar.has(s.tablo)) tablolar.set(s.tablo, []);
    tablolar.get(s.tablo).push(s);
  }

  const iliskiler = (await db.query(`
    select con.conname as ad, rel.relname as tablo, frel.relname as hedef,
           array(select a.attname::text from unnest(con.conkey) k join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k) as sutunlar,
           array(select a.attname::text from unnest(con.confkey) k join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k) as hedef_sutunlar,
           exists (select 1 from pg_index i where i.indrelid = con.conrelid and i.indisunique and i.indpred is null
                   and (select array_agg(x order by x) from unnest(i.indkey::int2[]) x) = (select array_agg(x order by x) from unnest(con.conkey) x)) as bire_bir
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid join pg_namespace n on n.oid = rel.relnamespace
    join pg_class frel on frel.oid = con.confrelid join pg_namespace fn on fn.oid = frel.relnamespace
    where con.contype = 'f' and n.nspname = 'public' and fn.nspname = 'public'
    order by con.conname`)).rows;

  const fonksiyonlar = (await db.query(`
    select p.proname as ad, p.proretset as kume, rt.typname as donus, rt.typtype as donus_turu,
           coalesce(p.proargnames, '{}') as arg_adlari,
           array(select t.typname::text from unnest(p.proargtypes) with ordinality a(oid, i) join pg_type t on t.oid = a.oid order by a.i) as arg_tipleri,
           p.pronargdefaults as varsayilan_sayisi
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type rt on rt.oid = p.prorettype
    where n.nspname = 'public' and rt.typname <> 'trigger'
    order by p.proname`)).rows;

  const satir = (alanlar) => `{\n${alanlar.join("\n")}\n        }`;
  const tabloKodu = [...tablolar].map(([tablo, cols]) => {
    const row = cols.map((c) => `          ${c.ad}: ${tsTipi(c.udt, c.dizi)}${c.bos ? " | null" : ""}`);
    const ins = cols.filter((c) => !c.hep_uretilir).map((c) =>
      `          ${c.ad}${c.bos || c.varsayilan ? "?" : ""}: ${tsTipi(c.udt, c.dizi)}${c.bos ? " | null" : ""}`);
    const upd = cols.filter((c) => !c.hep_uretilir).map((c) => `          ${c.ad}?: ${tsTipi(c.udt, c.dizi)}${c.bos ? " | null" : ""}`);
    const rel = iliskiler.filter((r) => r.tablo === tablo).map((r) => `          {
            foreignKeyName: "${r.ad}"
            columns: [${r.sutunlar.map((x) => `"${x}"`).join(", ")}]
            isOneToOne: ${r.bire_bir}
            referencedRelation: "${r.hedef}"
            referencedColumns: [${r.hedef_sutunlar.map((x) => `"${x}"`).join(", ")}]
          },`);
    return `      ${tablo}: {
        Row: ${satir(row)}
        Insert: ${satir(ins)}
        Update: ${satir(upd)}
        Relationships: [${rel.length ? `\n${rel.join("\n")}\n        ` : ""}]
      }`;
  });

  const fonksiyonKodu = fonksiyonlar.map((f) => {
    const zorunlu = f.arg_tipleri.length - f.varsayilan_sayisi;
    const args = f.arg_tipleri.map((t, i) => `          ${f.arg_adlari[i]}${i >= zorunlu ? "?" : ""}: ${tsTipi(t.replace(/^_/, ""), t.startsWith("_"))}`);
    let donus = f.donus === "void" ? "undefined" : f.donus_turu === "c" ? `Database["public"]["Tables"]["${f.donus}"]["Row"]` : tsTipi(f.donus);
    if (f.kume) donus = `${donus}[]`;
    return `      ${f.ad}: {
        Args: ${args.length ? satir(args) : "Record<PropertyKey, never>"}
        Returns: ${donus}
      }`;
  });

  const enumKodu = enumlar.map((e) => `      ${e.ad}: ${e.degerler.map((d) => `"${d}"`).join(" | ")}`);

  return `// Bu dosya scripts/db-tipleri.mjs ile üretilir; elle değiştirme. Migration değişince: npm run db:tipler
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
${tabloKodu.join("\n")}
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
${fonksiyonKodu.join("\n")}
    }
    Enums: {
${enumKodu.join("\n")}
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
`;
}
