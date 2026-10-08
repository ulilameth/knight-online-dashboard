import { describe, expect, it } from "vitest";
import { acildiMi, gunFarki, gunMetni, goreliZaman, kalanSure, saatMetni, tamMetin, tsi, tsiGunu } from "./time";

const ACILIS = tsi("2026-11-12T16:00");

describe("TSİ", () => {
  it("yerel saat UTC'ye çevrilir", () => {
    expect(ACILIS).toBe("2026-11-12T13:00:00.000Z");
    expect(tsi("2026-10-15")).toBe("2026-10-14T21:00:00.000Z");
    expect(() => tsi("12 Kasım")).toThrow("Geçersiz tarih");
  });

  it("biçimler Türkçe ve TSİ", () => {
    expect(saatMetni(ACILIS)).toBe("16:00");
    expect(gunMetni(ACILIS)).toBe("12 Kasım");
    expect(tamMetin(ACILIS)).toBe("12 Kasım Perşembe, 16:00");
  });

  it("gece yarısına yakın saatler TSİ gününe göre sayılır", () => {
    expect(tsiGunu("2026-11-11T22:30:00Z")).toBe("2026-11-12");
    expect(gunFarki(tsi("2026-11-11T23:50"), tsi("2026-11-12T00:10"))).toBe(1);
  });
});

describe("göreli zaman", () => {
  const su = new Date(tsi("2026-11-10T20:00"));
  it.each([
    [tsi("2026-11-10T20:00"), "şimdi"],
    [tsi("2026-11-10T20:30"), "30 dakika sonra"],
    [tsi("2026-11-10T23:00"), "3 saat sonra"],
    [tsi("2026-11-11T09:00"), "yarın"],
    [tsi("2026-11-09T21:00"), "dün"],
    [ACILIS, "öbür gün"],
    [tsi("2026-11-14T21:00"), "4 gün sonra"],
    [tsi("2026-12-01T21:00"), "3 hafta sonra"],
  ])("%s → %s", (iso, beklenen) => {
    expect(goreliZaman(iso, su)).toBe(beklenen);
  });
});

describe("açılış", () => {
  it("açılış anı dahil açılmış sayılır", () => {
    expect(acildiMi(ACILIS, new Date(Date.parse(ACILIS) - 1000))).toBe(false);
    expect(acildiMi(ACILIS, new Date(ACILIS))).toBe(true);
  });

  it("kalan süre gün/saat/dakika/saniye, geçince sıfır", () => {
    expect(kalanSure(ACILIS, new Date(tsi("2026-11-10T13:58")))).toEqual({ gun: 2, saat: 2, dakika: 2, saniye: 0 });
    expect(kalanSure(ACILIS, new Date(tsi("2026-11-13T00:00")))).toEqual({ gun: 0, saat: 0, dakika: 0, saniye: 0 });
  });
});

describe("gün bazında göreli ve hafta", () => {
  it("gunGoreli", async () => {
    const { gunGoreli } = await import("./time");
    const su = new Date(tsi("2026-11-10T23:30"));
    expect(gunGoreli(tsi("2026-11-10T08:00"), su)).toBe("bugün");
    expect(gunGoreli(tsi("2026-11-11T00:10"), su)).toBe("yarın");
    expect(gunGoreli(tsi("2026-11-14T21:00"), su)).toBe("4 gün sonra");
    expect(gunGoreli(tsi("2026-11-08T21:00"), su)).toBe("2 gün önce");
  });
  it("haftanın pazartesisi (TSİ)", async () => {
    const { haftaninPazartesisi } = await import("./time");
    expect(haftaninPazartesisi(new Date(tsi("2026-11-22T23:59")))).toBe("2026-11-16");
    expect(haftaninPazartesisi(new Date(tsi("2026-11-23T00:01")))).toBe("2026-11-23");
  });
});
