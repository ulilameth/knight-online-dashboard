import { describe, expect, it } from "vitest";
import { davetCereziOku, davetCereziYaz } from "./davet-cerezi";
import { type AuthArkaUc, HATA, davetKoduKontrol, girisYap, icEposta, kayitOlustur, sifreSifirla } from "./giris";

/** Bellekte çalışan sahte arka uç: veritabanı fonksiyonlarının davranışını taklit eder */
function sahteArkaUc() {
  const denemeler = new Map<string, number>();
  const kullanicilar = new Map<string, { eposta: string; sifre: string }>();
  const nickler = new Map<string, string>([["karabey", "u-kara"]]);
  kullanicilar.set("u-kara", { eposta: icEposta("u-kara"), sifre: "dogru-sifre" });
  const kodlar = new Map<string, number>([["L4BEL-ABCD-EFGH", 1]]);
  const sifirlama = new Map<string, string>([["karabey:WXYZ-2345", "u-kara"]]);
  const olaylar: string[] = [];
  let oturum: string | null = null;

  const a: AuthArkaUc = {
    async rpc(ad, args) {
      const x = args as Record<string, string>;
      switch (ad) {
        case "deneme_asildi": return ((denemeler.get(x.p_anahtar) ?? 0) >= 5) as never;
        case "deneme_kaydet": denemeler.set(x.p_anahtar, (denemeler.get(x.p_anahtar) ?? 0) + 1); return undefined as never;
        case "deneme_temizle": denemeler.delete(x.p_anahtar); return undefined as never;
        case "giris_eposta": {
          const id = nickler.get(x.p_nick.toLowerCase());
          return (id ? kullanicilar.get(id)!.eposta : null) as never;
        }
        case "davet_dogrula": return ((kodlar.get(x.p_kod) ?? 0) > 0) as never;
        case "kayit_olustur": {
          if (!((kodlar.get(x.p_kod) ?? 0) > 0)) throw new Error(HATA.davet);
          if (nickler.has(x.p_nick.toLowerCase())) throw new Error(HATA.nickAlinmis);
          if (x.p_nick === "Patlat") throw new Error("connection reset");
          kodlar.set(x.p_kod, kodlar.get(x.p_kod)! - 1);
          nickler.set(x.p_nick.toLowerCase(), x.p_user_id);
          return "uye" as never;
        }
        case "sifirlama_kodu_kullan": {
          const id = sifirlama.get(`${x.p_nick.toLowerCase()}:${x.p_kod}`);
          if (!id) throw new Error(HATA.sifirlama);
          sifirlama.delete(`${x.p_nick.toLowerCase()}:${x.p_kod}`);
          return id as never;
        }
      }
      throw new Error(`bilinmeyen ${ad}`);
    },
    async kullaniciOlustur(id, eposta, sifre) { kullanicilar.set(id, { eposta, sifre }); olaylar.push(`olustur:${id}`); },
    async kullaniciSil(id) { kullanicilar.delete(id); olaylar.push(`sil:${id}`); },
    async sifreDegistir(id, sifre) { kullanicilar.get(id)!.sifre = sifre; },
    async oturumAc(eposta, sifre) {
      const k = [...kullanicilar].find(([, v]) => v.eposta === eposta && v.sifre === sifre);
      oturum = k ? k[0] : null;
      return oturum;
    },
    async sonGirisYaz(id) { olaylar.push(`son_giris:${id}`); },
  };
  return { a, denemeler, kullanicilar, olaylar, oturum: () => oturum };
}

describe("giriş", () => {
  it("nick büyük/küçük harf duyarsız, doğru şifreyle oturum açılır ve son giriş yazılır", async () => {
    const s = sahteArkaUc();
    expect(await girisYap(s.a, " KaraBey ", "dogru-sifre")).toEqual({ ok: true, deger: undefined });
    expect(s.oturum()).toBe("u-kara");
    expect(s.olaylar).toContain("son_giris:u-kara");
  });

  it("yanlış şifre ve olmayan nick aynı mesajı verir", async () => {
    const s = sahteArkaUc();
    expect(await girisYap(s.a, "KaraBey", "yanlis")).toEqual({ ok: false, hata: HATA.giris });
    expect(await girisYap(s.a, "Yok", "dogru-sifre")).toEqual({ ok: false, hata: HATA.giris });
  });

  it("aynı nick için 5 yanlış denemeden sonra doğru şifre de bekletilir; başarı sayacı sıfırlar", async () => {
    const s = sahteArkaUc();
    for (let i = 0; i < 4; i++) await girisYap(s.a, "karabey", "yanlis");
    expect((await girisYap(s.a, "KARABEY", "dogru-sifre")).ok).toBe(true);
    expect(s.denemeler.has("giris:karabey")).toBe(false);
    for (let i = 0; i < 5; i++) await girisYap(s.a, "karabey", "yanlis");
    expect(await girisYap(s.a, "karabey", "dogru-sifre")).toEqual({ ok: false, hata: HATA.bekle });
  });
});

describe("davet kodu", () => {
  it("boşluk ve küçük harf temizlenir", async () => {
    const s = sahteArkaUc();
    expect(await davetKoduKontrol(s.a, " l4bel-abcd-efgh ", "1.2.3.4")).toEqual({ ok: true, deger: "L4BEL-ABCD-EFGH" });
  });

  it("yanlış kodda tek tip mesaj, IP başına 5 denemeden sonra bekleme", async () => {
    const s = sahteArkaUc();
    for (let i = 0; i < 5; i++) expect(await davetKoduKontrol(s.a, "L4BEL-YANL-ISKD", "1.2.3.4")).toEqual({ ok: false, hata: HATA.davet });
    expect(await davetKoduKontrol(s.a, "L4BEL-ABCD-EFGH", "1.2.3.4")).toEqual({ ok: false, hata: HATA.bekle });
    expect((await davetKoduKontrol(s.a, "L4BEL-ABCD-EFGH", "5.6.7.8")).ok).toBe(true);
  });
});

describe("kayıt", () => {
  const girdi = { kod: "L4BEL-ABCD-EFGH", nick: "GeceKusu", sifre: "uzun-sifre", sifreTekrar: "uzun-sifre" };

  it("hesap iç e-postayla açılır, karakter oluşur, oturum açılır", async () => {
    const s = sahteArkaUc();
    expect(await kayitOlustur(s.a, girdi, () => "u-yeni")).toEqual({ ok: true, deger: { rutbe: "uye" } });
    expect(s.kullanicilar.get("u-yeni")?.eposta).toBe("u-yeni@uye.l4bel.invalid");
    expect(s.oturum()).toBe("u-yeni");
  });

  it("form hataları veritabanına gitmeden döner", async () => {
    const s = sahteArkaUc();
    expect(await kayitOlustur(s.a, { ...girdi, nick: "a b" })).toEqual({ ok: false, hata: HATA.nick });
    expect(await kayitOlustur(s.a, { ...girdi, sifre: "kisa", sifreTekrar: "kisa" })).toEqual({ ok: false, hata: HATA.sifreKisa });
    expect(await kayitOlustur(s.a, { ...girdi, sifreTekrar: "baska-sifre" })).toEqual({ ok: false, hata: HATA.sifreAyni });
    expect(s.olaylar).toEqual([]);
  });

  it("nick alınmışsa ya da kod geçersizse açılan kullanıcı silinir ve veritabanı mesajı gösterilir", async () => {
    const s = sahteArkaUc();
    expect(await kayitOlustur(s.a, { ...girdi, nick: "karabey" }, () => "u-1")).toEqual({ ok: false, hata: HATA.nickAlinmis });
    expect(await kayitOlustur(s.a, { ...girdi, kod: "L4BEL-YOK0-YOK0" }, () => "u-2")).toEqual({ ok: false, hata: HATA.davet });
    expect(s.olaylar).toEqual(["olustur:u-1", "sil:u-1", "olustur:u-2", "sil:u-2"]);
    expect(s.kullanicilar.has("u-1") || s.kullanicilar.has("u-2")).toBe(false);
  });

  it("beklenmeyen veritabanı hatası kullanıcıya genel mesajla gösterilir", async () => {
    const s = sahteArkaUc();
    expect(await kayitOlustur(s.a, { ...girdi, nick: "Patlat" }, () => "u-3")).toEqual({ ok: false, hata: HATA.genel });
    expect(s.kullanicilar.has("u-3")).toBe(false);
  });
});

describe("şifre sıfırlama", () => {
  const girdi = { nick: "KaraBey", kod: "WXYZ-2345", sifre: "yeni-sifre-1", sifreTekrar: "yeni-sifre-1" };

  it("doğru nick ve kodla şifre değişir, kod bir kez kullanılır", async () => {
    const s = sahteArkaUc();
    expect((await sifreSifirla(s.a, girdi, "1.2.3.4")).ok).toBe(true);
    expect(s.kullanicilar.get("u-kara")?.sifre).toBe("yeni-sifre-1");
    expect(await sifreSifirla(s.a, girdi, "1.2.3.4")).toEqual({ ok: false, hata: HATA.sifirlama });
  });

  it("sıfırlama giriş deneme sınırını kaldırır", async () => {
    const s = sahteArkaUc();
    for (let i = 0; i < 5; i++) await girisYap(s.a, "karabey", "yanlis");
    await sifreSifirla(s.a, girdi, "1.2.3.4");
    expect((await girisYap(s.a, "karabey", "yeni-sifre-1")).ok).toBe(true);
  });
});

describe("davet çerezi", () => {
  const anahtar = "test-anahtari";
  it("imzalı çerez 15 dakika geçerli", () => {
    const c = davetCereziYaz("L4BEL-ABCD-EFGH", anahtar, 0);
    expect(davetCereziOku(c, anahtar, 14 * 60_000)).toBe("L4BEL-ABCD-EFGH");
    expect(davetCereziOku(c, anahtar, 16 * 60_000)).toBeNull();
  });

  it("değiştirilmiş çerez ya da yanlış anahtar reddedilir", () => {
    const c = davetCereziYaz("L4BEL-ABCD-EFGH", anahtar, 0);
    const [veri, imza] = c.split(".");
    const sahte = Buffer.from(JSON.stringify({ kod: "L4BEL-BASK-AKOD", son: 1e15 })).toString("base64url");
    expect(davetCereziOku(`${sahte}.${imza}`, anahtar, 0)).toBeNull();
    expect(davetCereziOku(`${veri}.${imza}x`, anahtar, 0)).toBeNull();
    expect(davetCereziOku(c, "baska-anahtar", 0)).toBeNull();
    expect(davetCereziOku(undefined, anahtar, 0)).toBeNull();
  });
});
