import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testVeritabani } from "./veritabani";

const ADRES = process.env.DATABASE_URL;
const KOD_BICIMI = /^L4BEL-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

// Gerçek bir Postgres gerekir: DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm test
describe.skipIf(!ADRES)("veritabanı şeması ve yetki kuralları", () => {
  let db: Awaited<ReturnType<typeof testVeritabani>>;
  const id: Record<string, string> = {};
  const karakter: Record<string, string> = {};

  /** Supabase kullanıcısı oluşturur (sunucunun admin API'si yerine) ve davet koduyla kaydeder */
  async function kaydol(nick: string, kod: string) {
    // Sunucu gibi: iç e-posta = <kullanıcı kimliği>@uye.l4bel.invalid
    const { rows } = await db.sql("with y as (select gen_random_uuid() as id) insert into auth.users (id, email) select id, id || '@uye.l4bel.invalid' from y returning id");
    const kullanici = rows[0].id as string;
    const sonuc = await db.olarak("service_role", null, "select public.kayit_olustur($1, $2, $3) as rutbe", [kod, kullanici, nick]);
    id[nick] = kullanici;
    const k = await db.sql("select id from public.characters where profile_id = $1", [kullanici]);
    karakter[nick] = k.rows[0].id;
    return sonuc.rows[0].rutbe as string;
  }
  const uye = (nick: string, metin: string, degerler: unknown[] = []) => db.olarak("authenticated", id[nick], metin, degerler);
  const davet = async (nick: string, ...arg: unknown[]) =>
    (await uye(nick, `select public.davet_olustur(${arg.map((_, i) => `$${i + 1}`).join(", ")}) as kod`, arg)).rows[0].kod as string;

  beforeAll(async () => {
    db = await testVeritabani(ADRES!);
    // Kurulum (scripts/ilk-yonetici.sql): ilk kod SQL Editor'dan, sonra kurucu yönetici yapılır
    const { rows } = await db.sql("select private.davet_kodu_uret('uye', 1, 1, 'Kurucu', null) as kod");
    await kaydol("KaraBey", rows[0].kod);
    await db.sql("update public.profiles set yetki = 'yonetici' where id = $1", [id.KaraBey]);
    await db.sql("update public.characters set rutbe = 'lider' where id = $1", [karakter.KaraBey]);
  }, 60_000);
  afterAll(async () => db?.kapat());

  describe("davet kodu ve kayıt", () => {
    it("yetkili kod üretir; kod L4BEL-XXXX-XXXX biçiminde, karışan harfler yok", async () => {
      const kod = await davet("KaraBey");
      expect(kod).toMatch(KOD_BICIMI);
      const { rows } = await uye("KaraBey", "select son_dort, kullanim, max_kullanim, rutbe, bitis > now() + interval '6 days' as yedi_gun from public.invite_codes order by created_at desc limit 1");
      expect(rows[0]).toMatchObject({ son_dort: kod.slice(-4), kullanim: 0, max_kullanim: 25, rutbe: "uye", yedi_gun: true });
    });

    it("kodun kendisi saklanmaz, yalnızca hash", async () => {
      const kod = await davet("KaraBey");
      const { rows } = await db.sql("select count(*)::int as n from public.invite_codes where kod_hash = $1 or son_dort = $1", [kod]);
      expect(rows[0].n).toBe(0);
    });

    it("davet_dogrula: geçerli kod (küçük harf ve boşlukla da), yanlış kod", async () => {
      const kod = await davet("KaraBey");
      const dogrula = async (k: string) => (await db.olarak("service_role", null, "select public.davet_dogrula($1) as ok", [k])).rows[0].ok;
      expect(await dogrula(kod)).toBe(true);
      expect(await dogrula(` ${kod.toLowerCase()} `)).toBe(true);
      expect(await dogrula("L4BEL-AAAA-AAAA")).toBe(false);
    });

    it("kayıt: profil, hazırlık satırı ve karakter açılır, kullanım sayılır", async () => {
      const kod = await davet("KaraBey", "aday", 7, 25, "TS duyurusu");
      expect(await kaydol("GeceKusu", kod)).toBe("aday");
      const { rows } = await db.sql(
        `select p.yetki, c.ad, c.rutbe, h.otp, i.kullanim, (select count(*)::int from public.invite_redemptions r where r.code_id = i.id) as kayit
         from public.profiles p join public.characters c on c.profile_id = p.id join public.hazirlik h on h.profile_id = p.id,
              public.invite_codes i where p.id = $1 and i.aciklama = 'TS duyurusu'`, [id.GeceKusu]);
      expect(rows[0]).toMatchObject({ yetki: "uye", ad: "GeceKusu", rutbe: "aday", otp: false, kullanim: 1, kayit: 1 });
    });

    it("aynı nick (büyük/küçük harf farkıyla) ikinci kez alınamaz", async () => {
      const kod = await davet("KaraBey");
      await expect(kaydol("gecekusu", kod)).rejects.toThrow("Bu nick kullanılıyor");
    });

    it("yetkililerin eklediği hesapsız karakter, aynı nick'le kayıt olana bağlanır ve rütbesi korunur", async () => {
      await uye("KaraBey", "insert into public.characters (ad, sinif, rutbe) values ('Asena', 'priest', 'asistan')");
      const kod = await davet("KaraBey");
      expect(await kaydol("asena", kod)).toBe("asistan");
      const { rows } = await db.sql("select ad, sinif, profile_id from public.characters where lower(ad) = 'asena'");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ ad: "Asena", sinif: "priest", profile_id: id.asena });
    });

    it("tek kullanımlık, süresi dolmuş ve iptal edilmiş kodlar reddedilir (aynı mesajla)", async () => {
      const tek = await davet("KaraBey", "uye", 7, 1);
      await kaydol("Bozkurt", tek);
      await expect(kaydol("Kartal", tek)).rejects.toThrow("Kod geçersiz ya da süresi dolmuş");

      const eski = await davet("KaraBey");
      await db.sql("update public.invite_codes set bitis = now() - interval '1 minute' where son_dort = $1", [eski.slice(-4)]);
      await expect(kaydol("Kartal", eski)).rejects.toThrow("Kod geçersiz ya da süresi dolmuş");

      const iptal = await davet("KaraBey");
      await uye("KaraBey", "update public.invite_codes set aktif = false where son_dort = $1", [iptal.slice(-4)]);
      await expect(kaydol("Kartal", iptal)).rejects.toThrow("Kod geçersiz ya da süresi dolmuş");
    });

    it("sunucu fonksiyonları anonim ve üye tarafından çağrılamaz", async () => {
      for (const rol of ["anon", "authenticated"] as const) {
        const kim = rol === "anon" ? null : id.GeceKusu;
        await expect(db.olarak(rol, kim, "select public.davet_dogrula('x')")).rejects.toThrow(/permission denied/);
        await expect(db.olarak(rol, kim, "select public.kayit_olustur('x', gen_random_uuid(), 'x')")).rejects.toThrow(/permission denied/);
        await expect(db.olarak(rol, kim, "select public.giris_eposta('KaraBey')")).rejects.toThrow(/permission denied/);
        await expect(db.olarak(rol, kim, "select public.deneme_kaydet('x')")).rejects.toThrow(/permission denied/);
      }
    });

    it("üye kod üretemez ve kod listesini göremez", async () => {
      await expect(davet("GeceKusu")).rejects.toThrow("yetkili olmalısın");
      expect((await uye("GeceKusu", "select * from public.invite_codes")).rowCount).toBe(0);
      expect((await uye("KaraBey", "select * from public.invite_codes")).rowCount).toBeGreaterThan(0);
    });
  });

  describe("giriş ve deneme sınırı", () => {
    it("nick'ten iç e-posta bulunur (büyük/küçük harf duyarsız)", async () => {
      const { rows } = await db.olarak("service_role", null, "select public.giris_eposta($1) as e", ["  KARABEY "]);
      expect(rows[0].e).toBe(`${id.KaraBey}@uye.l4bel.invalid`);
      const yok = await db.olarak("service_role", null, "select public.giris_eposta('Yok') as e");
      expect(yok.rows[0].e).toBeNull();
    });

    it("5 denemeden sonra sınır, temizleyince açılır", async () => {
      const sor = async () => (await db.olarak("service_role", null, "select public.deneme_asildi('giris:karabey') as a")).rows[0].a;
      for (let i = 0; i < 4; i++) await db.olarak("service_role", null, "select public.deneme_kaydet('giris:karabey')");
      expect(await sor()).toBe(false);
      await db.olarak("service_role", null, "select public.deneme_kaydet('giris:karabey')");
      expect(await sor()).toBe(true);
      await db.olarak("service_role", null, "select public.deneme_temizle('giris:karabey')");
      expect(await sor()).toBe(false);
    });
  });

  describe("okuma ve yazma kuralları", () => {
    it("anonim yalnızca klan ayarlarını okur", async () => {
      expect((await db.olarak("anon", null, "select klan_adi from public.clan_settings")).rows[0].klan_adi).toBe("L4BEL");
      expect((await db.olarak("anon", null, "select * from public.characters")).rowCount).toBe(0);
      expect((await db.olarak("anon", null, "select * from public.milestones")).rowCount).toBe(0);
    });

    it("üye her şeyi okur, karakter ve etkinlik yazamaz", async () => {
      expect((await uye("GeceKusu", "select * from public.characters")).rowCount).toBeGreaterThanOrEqual(4);
      expect((await uye("GeceKusu", "select * from public.milestones")).rowCount).toBe(4);
      expect((await uye("GeceKusu", "update public.characters set rutbe = 'lider' where id = $1", [karakter.GeceKusu])).rowCount).toBe(0);
      await expect(uye("GeceKusu", "insert into public.events (tur, baslik, baslangic) values ('bdw', 'BDW', now())")).rejects.toThrow(/row-level security/);
      await expect(uye("GeceKusu", "insert into public.character_changes (character_id, alan) values ($1, 'x')", [karakter.GeceKusu])).rejects.toThrow(/permission denied/);
    });

    it("yetkili etkinlik oluşturur ve yoklama alır", async () => {
      await db.olarak("authenticated", id.KaraBey, "select public.yetki_ver($1, 'yetkili')", [id.asena]);
      const { rows } = await uye("asena", "insert into public.events (tur, baslik, baslangic) values ('bdw', 'BDW', now()) returning id");
      await uye("asena", "insert into public.attendance (event_id, character_id, durum) values ($1, $2, 'katildi')", [rows[0].id, karakter.GeceKusu]);
      expect((await uye("GeceKusu", "select durum from public.attendance")).rows[0].durum).toBe("katildi");
    });

    it("üye profilinde yalnızca kendi TS nick'ini değiştirir, yetkisini değiştiremez", async () => {
      expect((await uye("GeceKusu", "update public.profiles set ts_nick = 'gecekusu.ts' where id = $1", [id.GeceKusu])).rowCount).toBe(1);
      expect((await uye("GeceKusu", "update public.profiles set ts_nick = 'x' where id = $1", [id.KaraBey])).rowCount).toBe(0);
      await expect(uye("GeceKusu", "update public.profiles set yetki = 'yonetici' where id = $1", [id.GeceKusu])).rejects.toThrow(/permission denied/);
    });

    it("hazırlık listesinde yalnızca kendi satırı", async () => {
      expect((await uye("GeceKusu", "update public.hazirlik set otp = true where profile_id = $1", [id.GeceKusu])).rowCount).toBe(1);
      expect((await uye("GeceKusu", "update public.hazirlik set otp = true where profile_id = $1", [id.KaraBey])).rowCount).toBe(0);
    });
  });

  describe("profil_guncelle", () => {
    it("açılıştan önce sınıf değişir, level girilemez; değişiklik kaydı tutulur", async () => {
      await uye("GeceKusu", "select public.profil_guncelle(p_sinif => 'rogue')");
      await expect(uye("GeceKusu", "select public.profil_guncelle(p_level => 70)")).rejects.toThrow("Level sunucu açılınca girilir");
      const { rows } = await uye("GeceKusu", "select alan, eski, yeni, degistiren from public.character_changes where character_id = $1", [karakter.GeceKusu]);
      expect(rows).toContainEqual({ alan: "sinif", eski: null, yeni: "rogue", degistiren: id.GeceKusu });
    });

    it("açılıştan sonra level sınırı ve reb kuralları", async () => {
      await db.sql("update public.clan_settings set acilis_at = now() - interval '1 day'");
      await expect(uye("GeceKusu", "select public.profil_guncelle(p_level => 81)")).rejects.toThrow("Level 1 ile 80 arası olmalı");
      const lv = await uye("GeceKusu", "select (public.profil_guncelle(p_level => 75, p_reb => 3)).*");
      expect(lv.rows[0]).toMatchObject({ level: 75, reb: 0 });

      await db.sql("update public.clan_settings set level_siniri = 83, reb_siniri = 2");
      await expect(uye("GeceKusu", "select public.profil_guncelle(p_level => 83, p_reb => 3)")).rejects.toThrow("Reb en fazla 2 olabilir");
      const reb = await uye("GeceKusu", "select (public.profil_guncelle(p_level => 83, p_reb => 2)).*");
      expect(reb.rows[0]).toMatchObject({ level: 83, reb: 2 });
      await db.sql("update public.clan_settings set level_siniri = 80, reb_siniri = 0, acilis_at = '2026-11-12 16:00+03'");
    });
  });

  describe("yetki ve şifre sıfırlama", () => {
    it("yalnızca yönetici yetki verir; son yönetici kendini düşüremez", async () => {
      await expect(uye("GeceKusu", "select public.yetki_ver($1, 'yonetici')", [id.GeceKusu])).rejects.toThrow("yönetici olmalısın");
      await expect(uye("KaraBey", "select public.yetki_ver($1, 'uye')", [id.KaraBey])).rejects.toThrow("en az bir yöneticisi");
    });

    it("yetkili üyenin sıfırlama kodunu üretir, yöneticininkini üretemez", async () => {
      const kod = (await uye("asena", "select public.sifirlama_kodu_olustur($1) as kod", [karakter.GeceKusu])).rows[0].kod;
      expect(kod).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
      await expect(uye("asena", "select public.sifirlama_kodu_olustur($1)", [karakter.KaraBey])).rejects.toThrow("yalnızca yönetici");
      await expect(uye("GeceKusu", "select public.sifirlama_kodu_olustur($1)", [karakter.Bozkurt])).rejects.toThrow("yetkili olmalısın");

      const kullan = (nick: string, k: string) => db.olarak("service_role", null, "select public.sifirlama_kodu_kullan($1, $2) as p", [nick, k]);
      await expect(kullan("Bozkurt", kod)).rejects.toThrow("Nick ya da kod hatalı");
      expect((await kullan("gecekusu", kod.toLowerCase())).rows[0].p).toBe(id.GeceKusu);
      await expect(kullan("gecekusu", kod)).rejects.toThrow("Nick ya da kod hatalı");
    });
  });

  describe("build görünürlüğü", () => {
    const kaydet = (nick: string, sablon = false) =>
      uye(nick, "insert into public.builds (character_id, sinif, level, sablon) values ($1, 'rogue', 75, $2)", [sablon ? null : karakter[nick], sablon]);

    it("üye kendi build'ini kaydeder, başkasının adına kaydedemez", async () => {
      await kaydet("GeceKusu");
      await expect(uye("Bozkurt", "insert into public.builds (character_id, sinif, level) values ($1, 'rogue', 75)", [karakter.GeceKusu])).rejects.toThrow(/row-level security/);
    });

    it("Klana göster: herkes görür; Gizli: yalnızca sahibi (yetkili ve yönetici de göremez)", async () => {
      const gor = async (nick: string) => (await uye(nick, "select 1 from public.builds where character_id = $1", [karakter.GeceKusu])).rowCount;
      expect(await gor("Bozkurt")).toBe(1);
      await uye("GeceKusu", "select public.profil_guncelle(p_ekipman_gorunur => 'gizli')");
      expect(await gor("Bozkurt")).toBe(0);
      expect(await gor("asena")).toBe(0);
      expect(await gor("KaraBey")).toBe(0);
      expect(await gor("GeceKusu")).toBe(1);
    });

    it("şablonu yalnızca yetkili kaydeder, herkes görür", async () => {
      await expect(kaydet("Bozkurt", true)).rejects.toThrow(/row-level security/);
      await kaydet("asena", true);
      expect((await uye("Bozkurt", "select 1 from public.builds where sablon")).rowCount).toBe(1);
    });
  });
});
