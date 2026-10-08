import { describe, expect, it } from "vitest";
import { asamalar, etkinlikTurleri } from "@/lib/demo/fixtures";
import { tsi } from "@/lib/time";
import type { Etkinlik } from "@/lib/types";
import { ayCoz, ayIzgarasi, ayKaydir, ayMetni, takvimOgeleri } from "./takvim";

const e = (id: string, tur: string, an: string): Etkinlik => ({ id, tur, baslik: `${id} başlık`, baslangic: tsi(an), bitis: null, aciklama: null, scheduleId: null, olusturan: null });

describe("takvim", () => {
  it("ay çözme: geçerli değer ya da bugünün ayı (TSİ)", () => {
    expect(ayCoz("2026-11", new Date())).toEqual({ yil: 2026, ay: 11 });
    // UTC 31 Ekim 22:00 = TSİ 1 Kasım 01:00
    expect(ayCoz(undefined, new Date("2026-10-31T22:00:00Z"))).toEqual({ yil: 2026, ay: 11 });
    expect(ayCoz("2026-13", new Date("2026-10-08T12:00:00Z"))).toEqual({ yil: 2026, ay: 10 });
    expect(ayCoz("abc", new Date("2026-10-08T12:00:00Z"))).toEqual({ yil: 2026, ay: 10 });
  });

  it("ay kaydırma yıl sınırını geçer", () => {
    expect(ayMetni(ayKaydir({ yil: 2026, ay: 12 }, 1))).toBe("2027-01");
    expect(ayMetni(ayKaydir({ yil: 2026, ay: 1 }, -1))).toBe("2025-12");
    expect(ayMetni(ayKaydir({ yil: 2026, ay: 11 }, 0))).toBe("2026-11");
  });

  it("ızgara pazartesiden pazara, tam haftalar", () => {
    const k = ayIzgarasi({ yil: 2026, ay: 11 }); // 1 Kasım 2026 pazar
    expect(k[0]).toBe("2026-10-26");
    expect(k.at(-1)).toBe("2026-12-06");
    expect(k.length).toBe(42);
    const s = ayIzgarasi({ yil: 2027, ay: 2 }); // 1 Şubat 2027 pazartesi, 28 gün
    expect([s[0], s.at(-1), s.length]).toEqual(["2027-02-01", "2027-02-28", 28]);
  });

  it("öğeler: TSİ gününe göre; savaş türüyle, toplantı başlığıyla; çok günlü aşamanın son günü", () => {
    const o = takvimOgeleri([e("x", "bdw", "2026-11-16T21:00"), e("t", "toplanti", "2026-11-12T00:30")], asamalar, etkinlikTurleri);
    expect(o.find((x) => x.id === "x")).toMatchObject({ gun: "2026-11-16", saat: "21:00", kisa: "BDW", etkinlikId: "x" });
    expect(o.find((x) => x.id === "t")).toMatchObject({ gun: "2026-11-12", kisa: "t başlık" });
    const onKayit = asamalar.find((a) => a.sira === 1)!;
    expect(o.filter((x) => x.id.startsWith(`a${onKayit.id}`)).map((x) => [x.gun, x.saat])).toEqual([["2026-10-15", "Gün boyu"], ["2026-10-29", "Son gün"]]);
    const acilis = asamalar.find((a) => a.saatBelli)!;
    expect(o.find((x) => x.id === `a${acilis.id}`)).toMatchObject({ gun: "2026-11-12", saat: "16:00", resmi: true });
    // Aynı gün: resmi önce
    expect(o.filter((x) => x.gun === "2026-11-12").map((x) => x.resmi)).toEqual([true, false]);
  });
});
