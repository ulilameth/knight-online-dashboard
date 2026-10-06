import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const KOK = fileURLToPath(new URL("../..", import.meta.url));

export type Rol = "anon" | "authenticated" | "service_role";

/**
 * DATABASE_URL'deki sunucuda geçici bir veritabanı açar, Supabase taklidini ve migration'ları (istenirse seed.sql'i) uygular.
 * Sorgular istenen rolle ve JWT "sub" değeriyle (Supabase'in PostgREST'e yaptığı gibi) tek işlemde çalışır.
 */
export async function testVeritabani(adresi: string, secenek: { seed?: boolean } = {}) {
  const ad = `l4bel_test_${process.pid}_${Date.now()}`;
  const yonetim = new Client({ connectionString: adresi });
  await yonetim.connect();
  await yonetim.query(`create database ${ad}`);

  const url = new URL(adresi);
  url.pathname = `/${ad}`;
  const db = new Client({ connectionString: url.toString() });
  await db.connect();
  await db.query(readFileSync(join(KOK, "supabase", "tests", "supabase-stub.sql"), "utf8"));
  const migrations = join(KOK, "supabase", "migrations");
  for (const dosya of readdirSync(migrations).filter((d) => d.endsWith(".sql")).sort()) {
    await db.query(readFileSync(join(migrations, dosya), "utf8"));
  }
  if (secenek.seed) await db.query(readFileSync(join(KOK, "supabase", "seed.sql"), "utf8"));

  /** Superuser olarak (Supabase SQL Editor gibi) */
  const sql = (metin: string, degerler: unknown[] = []) => db.query(metin, degerler);

  /** Rol ve kullanıcıyla; hata olursa işlem geri alınır ve hata fırlatılır */
  async function olarak(rol: Rol, kullanici: string | null, metin: string, degerler: unknown[] = []) {
    await db.query("begin");
    try {
      await db.query(`set local role ${rol}`);
      await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: kullanici, role: rol })]);
      const sonuc = await db.query(metin, degerler);
      await db.query("commit");
      return sonuc;
    } catch (hata) {
      await db.query("rollback");
      throw hata;
    }
  }

  async function kapat() {
    await db.end();
    await yonetim.query(`drop database if exists ${ad} with (force)`);
    await yonetim.end();
  }

  return { sql, olarak, kapat };
}
