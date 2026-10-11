import { describe, expect, it } from "vitest";
import { EN_YUKSEK_LEVEL, aradaki, bar, barYuzdesi, birikmis } from "./exp";
import { aralikOf, barMetni, durakDurumu, durakPayi, expMetni, gorevAra, ilerleme, karsilama, kisaAd, npcOf, oneriOf } from "./hesap";
import { ARALIKLAR, GOREVLER, KAYNAKLAR } from "./veri";

const aralik = (id: string) => ARALIKLAR.find((a) => a.id === id)!;

describe("EXP tablosu", () => {
  it("toplamlar raporla aynı", () => {
    expect(EN_YUKSEK_LEVEL).toBe(83);
    expect(birikmis(1)).toBe(0);
    expect(aradaki(1, 10)).toBe(8_070);
    expect(aradaki(1, 60)).toBe(351_525_803);
    expect(aradaki(1, 80)).toBe(10_789_460_044);
    // 70→80, 1→80'in %79'u
    expect(Math.round((aradaki(70, 80) / aradaki(1, 80)) * 100)).toBe(79);
  });

  it("bar sınırların dışında kırpılır", () => {
    expect(bar(0)).toBe(50);
    expect(bar(35)).toBe(808_207);
    expect(bar(99)).toBe(bar(83));
    expect(barYuzdesi(808_207, 35)).toBe(100);
  });
});

describe("aralık", () => {
  it("aralığın son leveli bir sonrakine aittir", () => {
    expect(aralikOf(1).id).toBe("1-10");
    expect(aralikOf(9).id).toBe("1-10");
    expect(aralikOf(10).id).toBe("10-20");
    expect(aralikOf(60).id).toBe("60-70");
    expect(aralikOf(79).id).toBe("75-80");
    expect(aralikOf(80).id).toBe("80-83");
    expect(aralikOf(83).id).toBe("80-83");
    expect(aralikOf(0).id).toBe("1-10");
  });

  it("aralıklar boşluksuz ve sıralı", () => {
    ARALIKLAR.forEach((a, i) => {
      expect(a.levelMin).toBeLessThan(a.levelMax);
      if (i) expect(a.levelMin).toBe(ARALIKLAR[i - 1].levelMax);
    });
    expect(ARALIKLAR[0].levelMin).toBe(1);
    expect(ARALIKLAR.at(-1)?.levelMax).toBe(83);
  });
});

describe("görev verisi", () => {
  it("kimlikler tekil, level aralığın içinde, kaynaklar tanımlı", () => {
    expect(new Set(GOREVLER.map((g) => g.id)).size).toBe(GOREVLER.length);
    for (const g of GOREVLER) {
      const a = ARALIKLAR.find((x) => x.id === g.aralik)!;
      expect(g.level, g.id).toBeGreaterThanOrEqual(a.levelMin);
      expect(g.level, g.id).toBeLessThanOrEqual(a.levelMax);
      expect(g.kaynaklar.length, g.id).toBeGreaterThan(0);
      for (const k of g.kaynaklar) expect(KAYNAKLAR[k], `${g.id}: ${k}`).toBeDefined();
    }
  });

  it("80-82 görevleri ~540M; sınır 80 iken saklanır, 83 olunca yapılır", () => {
    const saklanan = GOREVLER.filter((g) => g.oneri === "sakla");
    expect(saklanan.map((g) => g.id)).toEqual(["nightmare", "past-mistake", "fallen-spirit"]);
    expect(saklanan.reduce((t, g) => t + (g.exp ?? 0), 0)).toBe(540_000_000);
    expect(saklanan.every((g) => oneriOf(g, 80) === "sakla" && oneriOf(g, 83) === "hemen")).toBe(true);
    expect(oneriOf({ oneri: "ertele" }, 83)).toBe("ertele");
  });
});

describe("metinler", () => {
  it("NPC klanın tarafından", () => {
    const g = GOREVLER.find((x) => x.id === "nightmare")!;
    expect(npcOf(g, "karus")).toBe("[Ascetic] Veda");
    expect(npcOf(g, "el_morad")).toBe("[Ascetic] Tabeth");
    expect(npcOf({ npc: { ikisi: "[Guard] Patrick" } }, "el_morad")).toBe("[Guard] Patrick");
  });

  it("EXP kısaltması", () => {
    expect(expMetni(50)).toBe("50");
    expect(expMetni(15_125)).toBe("15.125");
    expect(expMetni(4_895_000)).toBe("4,9M");
    expect(expMetni(38_047_370)).toBe("38,05M");
    expect(expMetni(170_250_000)).toBe("170,3M");
    expect(expMetni(10_789_460_044)).toBe("10,79 milyar");
  });

  it("birleşik satırın kısa adı", () => {
    expect(kisaAd("Worm hunt")).toEqual({ baslik: "Worm hunt", ek: 0, parcalar: ["Worm hunt"] });
    expect(kisaAd("Nightmare (1) / Nightmare (2)").baslik).toBe("Nightmare (1–2)");
    expect(kisaAd("Fallen Spirit of Flame (1) / Fallen Spirit of Flame (2)").baslik).toBe("Fallen Spirit of Flame (1–2)");
    const u = kisaAd("Unfinished hunt II (1) / Unfinished hunt II (2) / Unfinished hunt III");
    expect([u.baslik, u.ek, u.parcalar.length]).toEqual(["Unfinished hunt II (1)", 2, 3]);
    expect(kisaAd("Kongaus Hunt / Ash Knight Hunt / Haunga Hunt")).toMatchObject({ baslik: "Kongaus Hunt", ek: 2 });
  });

  it("bar oranı", () => {
    expect(barMetni(170_250_000, 50)).toBe("11,2 bar");
    expect(barMetni(38_047_370, 60)).toBe("%52 bar");
    expect(barMetni(100, 80)).toBe("<%1 bar");
  });
});

describe("arama ve ilerleme", () => {
  it("arama: ad parçaları, NPC tarafa göre", () => {
    expect(gorevAra(GOREVLER, "  ", "karus")).toHaveLength(GOREVLER.length);
    // NPC tarafa göre aranır; "I" büyük harfi Türkçe küçültmede kaybolmaz
    expect(gorevAra(GOREVLER, "tabeth", "karus")).toHaveLength(0);
    expect(gorevAra(GOREVLER, "tabeth", "el_morad").length).toBeGreaterThan(0);
    expect(gorevAra(GOREVLER, "investigation", "karus").map((g) => g.id)).toEqual(["draki-start"]);
    // Birleşik satırın sonraki parçası da bulunur
    expect(gorevAra(GOREVLER, "haunga", "karus").map((g) => g.id)).toEqual(["tales-45"]);
  });

  it("ilerleme atlananları saymaz", () => {
    const atla = GOREVLER.filter((g) => g.oneri === "atla").length;
    expect(ilerleme(GOREVLER, 80, new Set(["worm-hunt", "guard-tower"]))).toEqual({ yapilan: 1, toplam: GOREVLER.length - atla });
  });

  it("görevler 70'e kadar ihtiyacı karşılar, 75-80'de ~%10", () => {
    const k = Object.fromEntries(karsilama().map((r) => [r.ad, Math.round(r.oran * 100)]));
    expect(k["60–70"]).toBeGreaterThanOrEqual(100);
    expect(k["70–75"]).toBe(46);
    expect(k["75–80"]).toBe(10);
  });
});

describe("rota", () => {
  it("durak durumu levele ve sınıra göre", () => {
    expect(durakDurumu(aralik("1-10"), 57, 80)).toBe("gecti");
    expect(durakDurumu(aralik("50-60"), 57, 80)).toBe("burada");
    expect(durakDurumu(aralik("60-70"), 57, 80)).toBe("ileride");
    expect(durakDurumu(aralik("80-83"), 80, 80)).toBe("kilitli");
    expect(durakDurumu(aralik("80-83"), 80, 83)).toBe("burada");
    expect(durakDurumu(aralik("75-80"), 80, 80)).toBe("gecti");
  });

  it("durak payı: 45-50 ve 50-60 birlikte, 80-83 yok", () => {
    expect(durakPayi(aralik("45-50"))?.ad).toBe("45–60");
    expect(durakPayi(aralik("50-60"))?.ad).toBe("45–60");
    expect(durakPayi(aralik("75-80"))?.ad).toBe("75–80");
    expect(durakPayi(aralik("80-83"))).toBeUndefined();
  });
});
