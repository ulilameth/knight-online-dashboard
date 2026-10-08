import { describe, expect, it } from "vitest";
import { asamalar, etkinlikTurleri, karakterler } from "@/lib/demo/fixtures";
import { tsi } from "@/lib/time";
import type { Etkinlik, Yoklama } from "@/lib/types";
import { asamaDurumu, asamaTarihi, enIstikrarli, gecmisEtkinlikler, sayim, sinifDagilimi, toplamKatilim, turKatilimi, uyeKatilimi } from "./istatistik";

const e = (id: string, tur: string, an: string): Etkinlik => ({ id, tur, baslik: id, baslangic: tsi(an), bitis: null, aciklama: null, scheduleId: null, olusturan: null });
const y = (eventId: string, characterId: string, durum: Yoklama["durum"]): Yoklama => ({ eventId, characterId, durum, isaretleyen: null, updatedAt: "" });

const ETK = [e("a", "bdw", "2026-11-16T21:00"), e("b", "csw", "2026-11-22T20:30"), e("c", "bdw", "2026-11-23T21:00"), e("t", "toplanti", "2026-11-01T21:00")];
const YOK = [y("a", "k1", "katildi"), y("a", "k2", "gec"), y("a", "k3", "yok"), y("b", "k1", "mazeretli"), y("b", "k2", "katildi"), y("t", "k1", "katildi")];

describe("istatistik", () => {
  it("sayım: işaretsizler karakter sayısından", () => {
    expect(sayim(YOK, "a", karakterler.slice(0, 5))).toEqual({ katildi: 1, gec: 1, mazeretli: 0, yok: 1, isaretsiz: 2 });
  });

  it("geçmiş etkinlikler: yalnızca başlamış ve yoklamalı türler, eskiden yeniye", () => {
    const g = gecmisEtkinlikler(ETK, etkinlikTurleri, new Date(tsi("2026-11-22T21:00")));
    expect(g.map((x) => x.id)).toEqual(["t", "a", "b"]);
  });

  it("tür bazında katılım: geç katılmış sayılır, mazeretli düşürür, toplantı hariç", () => {
    const g = gecmisEtkinlikler(ETK, etkinlikTurleri, new Date(tsi("2026-11-30")));
    const satir = turKatilimi(g, YOK, etkinlikTurleri);
    expect(satir.map((s) => s.tur.kod)).not.toContain("toplanti");
    expect(satir.find((s) => s.tur.kod === "bdw")).toMatchObject({ etkinlik: 2, gelen: 2, isaretli: 3, yuzde: 67 });
    expect(satir.find((s) => s.tur.kod === "csw")).toMatchObject({ etkinlik: 1, gelen: 1, isaretli: 2, yuzde: 50 });
    expect(satir.find((s) => s.tur.kod === "ft")).toMatchObject({ etkinlik: 0, yuzde: 0 });
  });

  it("üye katılımı ve en istikrarlı", () => {
    expect(uyeKatilimi(["a", "b"], YOK, "k1")).toEqual({ yuzde: 50, gelen: 1, toplam: 2, mazeretli: 1 });
    expect(uyeKatilimi(["a"], YOK, "k9")).toBeNull();
    expect(toplamKatilim(["a", "b"], YOK)).toEqual({ gelen: 3, isaretli: 5, yuzde: 60 });
    const k = (id: string, ad: string) => ({ ...karakterler[0], id, ad });
    expect(enIstikrarli([k("k1", "A"), k("k2", "B"), k("k3", "C"), k("k9", "D")], ["a", "b"], YOK).map((x) => x.k.id)).toEqual(["k2", "k1", "k3"]);
  });

  it("sınıf dağılımı", () => {
    expect(sinifDagilimi(karakterler)).toEqual([
      { sinif: "warrior", adet: 5 }, { sinif: "rogue", adet: 4 }, { sinif: "mage", adet: 3 }, { sinif: "priest", adet: 4 }, { sinif: "kurian", adet: 2 },
    ]);
  });

  it("aşama tarihleri resmi metinle aynı", () => {
    expect(asamalar.map(asamaTarihi)).toEqual(["15 – 29 Ekim", "29 Ekim – 9 Kasım", "10 – 11 Kasım", "12 Kasım, 16:00"]);
  });

  it("aşama durumu", () => {
    const su = new Date(tsi("2026-11-01T12:00"));
    expect(asamalar.map((a) => asamaDurumu(a, su))).toEqual(["bitti", "simdi", "gelecek", "gelecek"]);
    expect(asamaDurumu(asamalar[3], new Date(tsi("2026-11-12T17:00")))).toBe("simdi");
    expect(asamaDurumu(asamalar[3], new Date(tsi("2026-11-14")))).toBe("bitti");
  });
});
