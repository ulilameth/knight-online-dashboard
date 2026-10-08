import { describe, expect, it } from "vitest";
import { asamalar } from "@/lib/demo/fixtures";
import { tsi } from "@/lib/time";
import type { DavetKodu } from "@/lib/types";
import { asamaFormunuCoz, asamadanForm, davetDurumu, klanFormunuCoz } from "./ayarlar";

const klan = { klanAdi: " L4BEL ", monogram: "L4", irk: "karus", sunucuAdi: "", tsAdres: "L4B", acilisGun: "2026-11-12", acilisSaat: "16:00", levelSiniri: "83+2" };

describe("klan bilgisi formu", () => {
  it("açılış TSİ, level sınırı seçimden", () => {
    expect(klanFormunuCoz(klan)).toEqual({
      klanAdi: "L4BEL", monogram: "L4", irk: "karus", sunucuAdi: null, tsAdres: "L4B", acilisAt: tsi("2026-11-12T16:00"), levelSiniri: 83, rebSiniri: 2,
    });
  });
  it("hatalar", () => {
    expect(klanFormunuCoz({ ...klan, monogram: "L 4" })).toEqual({ hata: "Monogram 1-3 karakter olmalı, boşluksuz" });
    expect(klanFormunuCoz({ ...klan, irk: "human" })).toEqual({ hata: "Irkı seç" });
    expect(klanFormunuCoz({ ...klan, acilisSaat: "" })).toEqual({ hata: "Açılış tarihi ve saati gerekli" });
    expect(klanFormunuCoz({ ...klan, levelSiniri: "80+1" })).toMatchObject({ hata: expect.stringContaining("Level sınırı") });
  });
});

describe("aşama formu", () => {
  it("son gün dahil: bitiş ertesi gece yarısı; formdan geri dönüş aynı", () => {
    for (const a of asamalar) expect(asamaFormunuCoz(asamadanForm(a), a.id)).toEqual(a);
    expect(asamaFormunuCoz({ sira: "1", baslik: "Ön kayıt", baslangicGun: "2026-10-15", saat: "", sonGun: "2026-10-29", aciklama: "", kaynakUrl: "" }))
      .toMatchObject({ baslangic: tsi("2026-10-15"), bitis: tsi("2026-10-30"), saatBelli: false, aciklama: null, kaynakUrl: null });
    expect(asamaFormunuCoz({ sira: "4", baslik: "Açılış", baslangicGun: "2026-11-12", saat: "16:00", sonGun: "", aciklama: "", kaynakUrl: "" }))
      .toMatchObject({ baslangic: tsi("2026-11-12T16:00"), bitis: null, saatBelli: true });
  });
  it("hatalar", () => {
    const f = { sira: "1", baslik: "x", baslangicGun: "2026-10-15", saat: "", sonGun: "", aciklama: "", kaynakUrl: "" };
    expect(asamaFormunuCoz({ ...f, sira: "0" })).toEqual({ hata: "Sıra 1-99 arası olmalı" });
    expect(asamaFormunuCoz({ ...f, sonGun: "2026-10-14" })).toEqual({ hata: "Son gün başlangıçtan önce olamaz" });
    expect(asamaFormunuCoz({ ...f, kaynakUrl: "nttgame.com" })).toEqual({ hata: "Kaynak bağlantısı http(s):// ile başlamalı" });
    expect(asamaFormunuCoz({ ...f, saat: "25:00" })).toEqual({ hata: "Saat SS:DD biçiminde olmalı" });
  });
});

describe("davet kodu durumu", () => {
  const k: DavetKodu = { id: "1", sonDort: "ABCD", rutbe: "uye", maxKullanim: 2, kullanim: 0, bitis: "2026-10-10T00:00:00Z", aktif: true, aciklama: null, olusturan: null, createdAt: "" };
  const su = new Date("2026-10-08T00:00:00Z");
  it("iptal > doldu > süresi doldu > geçerli", () => {
    expect(davetDurumu(k, su)).toBe("aktif");
    expect(davetDurumu({ ...k, bitis: "2026-10-07T00:00:00Z" }, su)).toBe("suresi_doldu");
    expect(davetDurumu({ ...k, kullanim: 2 }, su)).toBe("doldu");
    expect(davetDurumu({ ...k, aktif: false, kullanim: 2 }, su)).toBe("iptal");
  });
});
