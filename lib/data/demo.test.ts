// Demo adaptörleri veritabanındaki kuralları (RLS ve fonksiyonlar) taklit eder; burada aynı senaryolar denenir.
import { beforeEach, describe, expect, it } from "vitest";
import { demoAuthArkaUc } from "@/lib/demo/auth";
import { type DemoDepo, yeniDemoDepo } from "@/lib/demo/depo";
import { DEMO_DAVET_KODU, DEMO_SIFRE, karakterId, profilId } from "@/lib/demo/fixtures";
import { girisYap, kayitOlustur } from "@/lib/giris";
import { tsi } from "@/lib/time";
import { katilimOrani, demoYoklamalar } from "./attendance";
import { demoBuildler } from "./builds";
import { demoEtkinlikler, haftaninEtkinlikleri } from "./events";
import { demoKatalogVerisi } from "./items";
import { demoDavetler } from "./invites";
import { demoUyeler, profilKurallari } from "./members";
import { YETKI_YOK } from "./ortak";
import { demoAyarlar, levelSiniriCoz, levelSiniriMetni } from "./settings";

let depo: DemoDepo;
const ol = (nick: string | null) => ({ depo, kullaniciId: nick ? profilId(nick) : null });
beforeEach(() => { depo = yeniDemoDepo(); });

describe("demo: üyeler", () => {
  it("oturum yoksa hiçbir şey okunmaz", async () => {
    await expect(demoUyeler(ol(null)).karakterler()).rejects.toThrow(YETKI_YOK);
  });

  it("üye karakter ekleyemez; yetkili ekler, aynı nick'i (büyük/küçük harf) ikinci kez ekleyemez", async () => {
    const g = { ad: "Yeniçeri", sinif: "warrior" as const, level: null, reb: 0, rutbe: "aday" as const, durum: "aktif" as const };
    await expect(demoUyeler(ol("GeceKuşu")).karakterEkle(g)).rejects.toThrow(YETKI_YOK);
    const k = await demoUyeler(ol("DemirYumruk")).karakterEkle(g);
    expect(k).toMatchObject({ ad: "Yeniçeri", profileId: null, rutbe: "aday" });
    await expect(demoUyeler(ol("DemirYumruk")).karakterEkle({ ...g, ad: "YENİÇERİ" })).rejects.toThrow("Bu nick kullanılıyor");
    await expect(demoUyeler(ol("DemirYumruk")).karakterEkle({ ...g, ad: "a b" })).rejects.toThrow("Nick 2-20");
  });

  it("yetkili düzenlemesi değişiklik kaydına düşer", async () => {
    await demoUyeler(ol("DemirYumruk")).karakterGuncelle(karakterId("Bozkurt"), { rutbe: "subay" });
    const d = await demoUyeler(ol("Bozkurt")).degisiklikler(karakterId("Bozkurt"));
    expect(d[0]).toMatchObject({ alan: "rutbe", eski: "uye", yeni: "subay", degistiren: profilId("DemirYumruk") });
  });

  it("profil: açılıştan önce level yok, sınıf ve TS nick değişir", async () => {
    const u = demoUyeler(ol("GeceKuşu"));
    await expect(u.profilGuncelle({ level: 70 })).rejects.toThrow("Level sunucu açılınca girilir");
    const k = await u.profilGuncelle({ sinif: "mage", tsNick: "  gece.ts " });
    expect(k.sinif).toBe("mage");
    expect(depo.profiller.find((p) => p.id === profilId("GeceKuşu"))?.tsNick).toBe("gece.ts");
  });
});

describe("profil kuralları (veritabanındaki profil_guncelle ile aynı)", () => {
  const ayar = { ...yeniDemoDepo().ayarlar, acilisAt: tsi("2026-11-12T16:00") };
  const sonra = new Date(tsi("2026-11-20T12:00"));
  it.each([
    [{ level: 81 }, "Level 1 ile 80 arası olmalı"],
    [{ level: 0 }, "Level 1 ile 80 arası olmalı"],
  ])("%o → %s", (g, hata) => {
    expect(() => profilKurallari(ayar, { level: 70, reb: 0 }, g, sonra)).toThrow(hata);
  });
  it("83'ten düşünce reb sıfırlanır, 83'te reb sınırı", () => {
    const a83 = { ...ayar, levelSiniri: 83 as const, rebSiniri: 2 };
    expect(profilKurallari(a83, { level: 83, reb: 2 }, { level: 80 }, sonra)).toEqual({ level: 80, reb: 0 });
    expect(() => profilKurallari(a83, { level: 83, reb: 0 }, { reb: 3 }, sonra)).toThrow("Reb en fazla 2 olabilir");
    expect(profilKurallari(a83, { level: 83, reb: 0 }, { reb: 2 }, sonra)).toEqual({ level: 83, reb: 2 });
  });
});

describe("demo: ayarlar", () => {
  it("level sınırı seçimi", () => {
    expect(levelSiniriCoz("80")).toEqual({ levelSiniri: 80, rebSiniri: 0 });
    expect(levelSiniriCoz("83+10")).toEqual({ levelSiniri: 83, rebSiniri: 10 });
    expect(() => levelSiniriCoz("80+1")).toThrow();
    expect(() => levelSiniriCoz("83+11")).toThrow();
    expect(levelSiniriMetni({ levelSiniri: 83, rebSiniri: 3 })).toBe("83+3");
  });

  it("yalnızca yönetici değiştirir; son yönetici kendini düşüremez", async () => {
    await expect(demoAyarlar(ol("DemirYumruk")).ayarlarGuncelle({ tsAdres: "X" })).rejects.toThrow(YETKI_YOK);
    const a = demoAyarlar(ol("KaraBey"));
    await a.yetkiVer(profilId("Asena"), "yetkili");
    await a.yetkiVer(profilId("SessizOk"), "yetkili");
    await expect(a.yetkiVer(profilId("KaraBey"), "uye")).rejects.toThrow("en az bir yöneticisi");
  });
});

describe("demo: build görünürlüğü", () => {
  it("Gizli build'i yalnızca sahibi görür", async () => {
    const baskasi = (await demoBuildler(ol("GeceKuşu")).kayitliBuildler()).map((b) => b.characterId);
    expect(baskasi).toContain(karakterId("KaraBey"));
    expect(baskasi).not.toContain(karakterId("Asena"));
    expect((await demoBuildler(ol("KaraBey")).kayitliBuildler()).map((b) => b.characterId)).not.toContain(karakterId("Asena"));
    expect((await demoBuildler(ol("Asena")).benimBuildim())?.characterId).toBe(karakterId("Asena"));
  });

  it("üye kendi build'ini kaydeder (karakter başına tek), şablonu yalnızca yetkili", async () => {
    const g = { ad: "Build", sinif: "rogue" as const, irkTuru: "tuarek", level: 71, reb: 0, statlar: { str: 57, hp: 0, dex: 185, int: 0, mp: 0 }, skiller: [0, 0, 0, 0] as [number, number, number, number], ekipman: {}, apGirdileri: {} };
    const b = demoBuildler(ol("GeceKuşu"));
    const ilk = await b.buildKaydet(g);
    const ikinci = await b.buildKaydet({ ...g, level: 72 });
    expect(ikinci.id).toBe(ilk.id);
    await expect(b.sablonKaydet(g)).rejects.toThrow(YETKI_YOK);
    await demoBuildler(ol("DemirYumruk")).sablonKaydet(g);
    expect(await b.sablonlar()).toHaveLength(1);
  });

  it("kurallara uymayan build kaydedilmez; hatalar tek mesajda", async () => {
    const g = { ad: "Build", sinif: "rogue" as const, irkTuru: "tuarek", level: 71, reb: 0, statlar: { str: 60, hp: 0, dex: 186, int: 0, mp: 0 }, skiller: [0, 0, 0, 0] as [number, number, number, number], ekipman: { 0: { itemId: 262, arti: 7 } }, apGirdileri: {} };
    await expect(demoBuildler(ol("GeceKuşu")).buildKaydet(g)).rejects.toThrow(
      "DEX en fazla 255 olabilir (70 + 186) · Stat puanı fazla: 246 dağıtıldı, bu levelde 242 · Exceptional Raptor bu sınıfa uygun değil");
    await expect(demoBuildler(ol("DemirYumruk")).sablonKaydet({ ...g, irkTuru: "arch_tuarek", statlar: { str: 0, hp: 0, dex: 0, int: 0, mp: 0 }, skiller: [0, 0, 0, 0], ekipman: {} }))
      .rejects.toThrow("Arch Tuarek bu sınıfı seçemez");
  });
});

describe("demo: eşya kataloğu ve kurallar", () => {
  it("oturum yoksa okunmaz", async () => {
    await expect(demoKatalogVerisi(ol(null)).esyalar()).rejects.toThrow(YETKI_YOK);
  });

  it("sınıfa ve yuvaya göre süzer; sınıfsız eşyalar herkese, ad araması Türkçe harf duyarsız", async () => {
    const k = demoKatalogVerisi(ol("GeceKuşu"));
    const tumu = await k.esyalar();
    expect(tumu).toHaveLength(770);
    const rogue = await k.esyalar({ sinif: "rogue" });
    expect(rogue.every((e) => !e.siniflar.length || e.siniflar.includes("rogue"))).toBe(true);
    expect(rogue.some((e) => !e.siniflar.length)).toBe(true);
    expect(rogue.length).toBeLessThan(tumu.length);
    const kanat = await k.esyalar({ yuva: "kanat" });
    expect(kanat.length).toBeGreaterThan(0);
    expect(kanat.every((e) => e.yuvalar.includes("kanat"))).toBe(true);
    expect((await k.esyalar({ ara: "HOLY KNIGHT PORTU" })).map((e) => e.id)).toContain(393);
    expect((await k.esyalar({ ara: "holy knıght" })).map((e) => e.id)).toContain(393);
  });

  it("eşya detayı artı seviyeleriyle; kurallar sınıf ağaçları ve ırklarla", async () => {
    const k = demoKatalogVerisi(ol("GeceKuşu"));
    const e = await k.esya(393);
    expect(e?.dereceler.find((d) => d.arti === 7)?.degerler).toMatchObject({ Defense: 107, RequiredLevel: 75 });
    expect(await k.esya(999_999)).toBeNull();
    expect([...(await k.esyaDetaylari([393, 999_999])).keys()]).toEqual([393]);
    const kur = await k.kurallar();
    expect(kur.agaclar.mage).toEqual(["Flame", "Glacier", "Lightning", "Master"]);
    expect(kur.irklar).toHaveLength(9);
    expect(kur.oyun.statCap).toBe(255);
  });
});

describe("demo: davet ve kayıt", () => {
  it("üye kod üretemez; yetkilinin kodu L4BEL-XXXX-XXXX, kayıtta kullanılır", async () => {
    await expect(demoDavetler(ol("GeceKuşu")).kodOlustur({ rutbe: "uye" })).rejects.toThrow(YETKI_YOK);
    const kod = await demoDavetler(ol("DemirYumruk")).kodOlustur({ rutbe: "aday", maxKullanim: 1 });
    expect(kod).toMatch(/^L4BEL-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);

    let oturum = "";
    const a = demoAuthArkaUc(depo, async (id) => { oturum = id; });
    expect(await kayitOlustur(a, { kod, nick: "YeniÜye", sifre: "uzun-sifre", sifreTekrar: "uzun-sifre" }, () => "p-yeni")).toEqual({ ok: true, deger: { rutbe: "aday" } });
    expect(oturum).toBe("p-yeni");
    expect(depo.karakterler.find((k) => k.ad === "YeniÜye")).toMatchObject({ profileId: "p-yeni", rutbe: "aday" });
    expect((await kayitOlustur(a, { kod, nick: "Başka", sifre: "uzun-sifre", sifreTekrar: "uzun-sifre" }, () => "p-2")).ok).toBe(false);
    expect(depo.hesaplar.has("p-2")).toBe(false);
  });

  it("demo hesaplarıyla giriş ve demo davet kodu", async () => {
    let oturum = "";
    const a = demoAuthArkaUc(depo, async (id) => { oturum = id; });
    expect((await girisYap(a, "karabey", DEMO_SIFRE)).ok).toBe(true);
    expect(oturum).toBe(profilId("KaraBey"));
    expect(await a.rpc("davet_dogrula", { p_kod: DEMO_DAVET_KODU })).toBe(true);
  });

  it("yetkili yöneticinin sıfırlama kodunu üretemez", async () => {
    await expect(demoDavetler(ol("DemirYumruk")).sifirlamaKoduOlustur(karakterId("KaraBey"))).rejects.toThrow("yalnızca yönetici");
    expect(await demoDavetler(ol("DemirYumruk")).sifirlamaKoduOlustur(karakterId("Bozkurt"))).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });
});

describe("demo: eşya kataloğu yazma", () => {
  const pelerin = { ad: "Klan Pelerini", kategori: "Wings", yuvalar: ["kanat"], siniflar: [], derece: "cospre" as const, dereceler: [{ arti: 0, degerler: { BonusHp: 100 } }] };

  it("yalnızca yetkili ekler; yeni eşya 1.000.000'dan başlar, listede ve build'de görünür", async () => {
    await expect(demoKatalogVerisi(ol("GeceKuşu")).esyaKaydet(pelerin)).rejects.toThrow(YETKI_YOK);
    const k = demoKatalogVerisi(ol("DemirYumruk"));
    const e = await k.esyaKaydet(pelerin);
    expect(e).toMatchObject({ id: 1_000_000, kaynak: "elle", dereceler: [{ arti: 0, degerler: { BonusHp: 100 } }] });
    expect((await k.esyaKaydet(pelerin)).id).toBe(1_000_001);
    expect((await demoKatalogVerisi(ol("GeceKuşu")).esyalar({ yuva: "kanat" })).map((x) => x.id)).toContain(1_000_000);
    expect((await demoKatalogVerisi(ol("GeceKuşu")).esyalar({ yuva: "kanat" }))[0]).not.toHaveProperty("dereceler");
  });

  it("KO Bugda eşyası düzenlenir (set bilgisi korunur), silinmez; elle eşya silinir", async () => {
    const k = demoKatalogVerisi(ol("DemirYumruk"));
    const e = await k.esyaKaydet({ id: 393, ad: "Holy Knight Portu Boots", kategori: "Armor - Kurian", yuvalar: ["bot"], siniflar: ["kurian"], derece: "set", etki: "Deneme" });
    expect(e).toMatchObject({ etki: "Deneme", setAnahtari: "393,394,395,396,397", kaynak: "kobugda" });
    expect(e.dereceler.length).toBeGreaterThan(0);
    await expect(k.esyaSil(393)).rejects.toThrow("KO Bugda eşyaları silinmez");
    const yeni = await k.esyaKaydet(pelerin);
    await k.esyaSil(yeni.id);
    expect(await k.esya(yeni.id)).toBeNull();
  });

  it("içe aktarma: biri hatalıysa hiçbiri yazılmaz; sonra eklenen/güncellenen sayılır", async () => {
    const k = demoKatalogVerisi(ol("DemirYumruk"));
    await expect(k.iceAktar([pelerin, { ...pelerin, yuvalar: ["omuz"] }])).rejects.toThrow("Bilinmeyen yuva: omuz");
    expect(await k.esya(1_000_000)).toBeNull();
    const ilk = await k.iceAktar([{ ...pelerin, id: 1_000_010 }, { ...pelerin, id: 1_000_011 }]);
    expect(ilk).toEqual({ eklenen: 2, guncellenen: 0 });
    expect(await k.iceAktar([{ ...pelerin, id: 1_000_010, ad: "Yeni ad" }])).toEqual({ eklenen: 0, guncellenen: 1 });
    expect((await k.esya(1_000_010))?.ad).toBe("Yeni ad");
  });
});

describe("haftalık düzen ve yoklama", () => {
  it("pazartesiden başlayan haftanın etkinlikleri TSİ'de doğru günlerde", () => {
    const e = haftaninEtkinlikleri("2026-11-16", yeniDemoDepo().haftalikDuzen);
    expect(e).toHaveLength(7);
    expect(e[0]).toMatchObject({ tur: "bdw", baslangic: tsi("2026-11-16T21:00"), bitis: tsi("2026-11-16T22:00") });
    expect(e[6]).toMatchObject({ tur: "csw", baslangic: tsi("2026-11-22T20:30") });
    expect(() => haftaninEtkinlikleri("2026-11-17", [])).toThrow("pazartesiden");
  });

  it("haftayı oluştur iki kez çalışınca tekrar oluşturmaz", async () => {
    const e = demoEtkinlikler(ol("DemirYumruk"));
    expect(await e.haftayiOlustur("2026-12-07")).toHaveLength(7);
    expect(await e.haftayiOlustur("2026-12-07")).toHaveLength(0);
    await expect(demoEtkinlikler(ol("GeceKuşu")).haftayiOlustur("2026-12-14")).rejects.toThrow(YETKI_YOK);
  });

  it("yoklama işaretle ve katılım oranı (geç sayılır, mazeretli düşürür)", async () => {
    const y = demoYoklamalar(ol("DemirYumruk"));
    const ev = depo.etkinlikler[0].id;
    await y.isaretle(ev, [karakterId("Bozkurt")], "gec");
    const tum = (await y.yoklamalar()).filter((x) => x.characterId === karakterId("Bozkurt"));
    const oran = katilimOrani(tum, karakterId("Bozkurt"))!;
    expect(oran.toplam).toBe(tum.length);
    expect(oran.yuzde).toBe(Math.round((tum.filter((x) => x.durum === "katildi" || x.durum === "gec").length / tum.length) * 100));
    await expect(demoYoklamalar(ol("Bozkurt")).isaretle(ev, [karakterId("Bozkurt")], "katildi")).rejects.toThrow(YETKI_YOK);
  });
});
