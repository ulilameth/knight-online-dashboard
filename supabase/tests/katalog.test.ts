import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import katalogJson from "@/design/katalog.json";
import { agaclar, irklar, oyunKuralSatirlari } from "@/lib/demo/fixtures";
import { irkStatlari } from "@/lib/data/ortak";
import { katalogSatirlari, type Katalog } from "@/lib/katalog/satirlar.mjs";
import { testVeritabani } from "./veritabani";

const ADRES = process.env.DATABASE_URL;
const satirlar = katalogSatirlari(katalogJson as unknown as Katalog);

// Gerçek bir Postgres gerekir: DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm test
describe.skipIf(!ADRES)("eşya kataloğu seed'i ve karakter kuralları", () => {
  let db: Awaited<ReturnType<typeof testVeritabani>>;
  let uye: string;
  let disaridan: string;

  beforeAll(async () => {
    db = await testVeritabani(ADRES!, { seed: true });
    const kullanici = async () => (await db.sql("with y as (select gen_random_uuid() as id) insert into auth.users (id, email) select id, id || '@uye.l4bel.invalid' from y returning id")).rows[0].id as string;
    uye = await kullanici();
    await db.sql("insert into public.profiles (id) values ($1)", [uye]);
    disaridan = await kullanici();  // Auth hesabı var, panel profili yok
  }, 60_000);
  afterAll(async () => db?.kapat());

  const say = async (tablo: string) => Number((await db.sql(`select count(*) from public.${tablo}`)).rows[0].count);

  it("seed design/katalog.json'daki her şeyi yükler", async () => {
    expect(await say("items")).toBe(satirlar.items.length);
    expect(await say("item_stats")).toBe(satirlar.item_stats.length);
    expect(await say("item_sets")).toBe(satirlar.item_sets.length);
    expect(await say("item_set_bonuses")).toBe(satirlar.item_set_bonuses.length);
    const { rows } = await db.sql("select * from public.items where id = 393");
    expect(rows[0]).toMatchObject({ ad: "Holy Knight Portu Boots", yuvalar: ["bot"], siniflar: "{kurian}", derece: "set", set_anahtari: "393,394,395,396,397", set_parcasi: ["HOLY_KNIGHT", 8] });
    expect((await db.sql("select degerler from public.item_stats where item_id = 393 and arti = 7")).rows[0].degerler)
      .toEqual({ Defense: 107, BonusStrength: 16, RequiredLevel: 75, RequiredHealth: 88, RequiredStrength: 158, RequiredMagicPower: 103 });
  });

  it("tekrar çalıştırılabilir; elle eklenen eşyaya dokunmaz", async () => {
    await db.sql("insert into public.items (id, ad, kategori, yuvalar, kaynak) values (1000000, 'Klan Pelerini', 'Elle', '{kanat}', 'elle')");
    await db.sql("update public.items set ad = 'bozuldu' where id = 393");
    await db.sql(readFileSync(new URL("../seed.sql", import.meta.url), "utf8"));
    expect(await say("items")).toBe(satirlar.items.length + 1);
    expect((await db.sql("select ad from public.items where id = 393")).rows[0].ad).toBe("Holy Knight Portu Boots");
    expect((await db.sql("select ad from public.items where id = 1000000")).rows[0].ad).toBe("Klan Pelerini");
  });

  it("demo modunun kuralları migration seed'iyle aynı", async () => {
    const kurallar = (await db.sql("select anahtar, deger, dogrulandi from public.game_rules order by anahtar")).rows;
    expect(kurallar).toEqual([...oyunKuralSatirlari].sort((a, b) => a.anahtar.localeCompare(b.anahtar)));
    const irkSatirlari = (await db.sql("select irk_turu, ad, taraf, siniflar::text[] as siniflar, str, hp, dex, int, mp, dogrulandi from public.race_stats")).rows;
    expect(irkSatirlari.map(irkStatlari).sort((a, b) => a.irkTuru.localeCompare(b.irkTuru)))
      .toEqual([...irklar].sort((a, b) => a.irkTuru.localeCompare(b.irkTuru)));
    const agacSatirlari = (await db.sql("select sinif::text, ad from public.class_trees order by sinif, sira")).rows;
    const dbAgaclar: Record<string, string[]> = {};
    for (const a of agacSatirlari) (dbAgaclar[a.sinif] ??= []).push(a.ad);
    expect(dbAgaclar).toEqual(agaclar);
  });

  it("katalog ve kurallar yalnızca üyelere açık", async () => {
    for (const tablo of ["items", "item_stats", "item_sets", "item_set_bonuses", "game_rules", "race_stats", "class_trees"]) {
      expect((await db.olarak("authenticated", uye, `select 1 from public.${tablo} limit 1`)).rowCount, tablo).toBe(1);
      expect((await db.olarak("authenticated", disaridan, `select 1 from public.${tablo} limit 1`)).rowCount, tablo).toBe(0);
      expect((await db.olarak("anon", null, `select 1 from public.${tablo} limit 1`)).rowCount, tablo).toBe(0);
    }
  });

  it("yetkili eşya ve derece yazar, siler", async () => {
    const yetkili = (await db.sql("with y as (select gen_random_uuid() as id) insert into auth.users (id, email) select id, id || '@uye.l4bel.invalid' from y returning id")).rows[0].id as string;
    await db.sql("insert into public.profiles (id, yetki) values ($1, 'yetkili')", [yetkili]);
    await db.olarak("authenticated", yetkili, "insert into public.items (id, ad, kategori, yuvalar, kaynak) values (1000002, 'Yüzük', 'Ring', '{yuzuk}', 'elle')");
    await db.olarak("authenticated", yetkili, "insert into public.item_stats (item_id, arti, degerler) values (1000002, 0, '{\"BonusHp\": 50}')");
    await db.olarak("authenticated", yetkili, "update public.items set etki = 'x' where id = 393");
    expect((await db.olarak("authenticated", yetkili, "delete from public.items where id = 1000002")).rowCount).toBe(1);
    expect(await say("item_stats")).toBe(satirlar.item_stats.length);
  });

  it("üye kataloğu değiştiremez", async () => {
    const r = await db.olarak("authenticated", uye, "update public.items set ad = 'x' where id = 393");
    expect(r.rowCount).toBe(0);
    await expect(db.olarak("authenticated", uye, "insert into public.items (id, ad, kategori, yuvalar) values (1000001, 'x', 'x', '{kask}')")).rejects.toThrow(/row-level security/);
  });
});
