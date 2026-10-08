import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildler } from "@/lib/demo/fixtures";
import type { Build } from "@/lib/types";
import { EK_YOK, ekipmanToplami, hesapla, havuzlar, kurallariOku, setBonusu, skillSiniri, VARSAYILAN_KURALLAR } from "./hesap";
import { type KatalogJson, esyaAdi, kataloguHazirla, setBonusMetni } from "./katalog";

const kat = kataloguHazirla(JSON.parse(readFileSync(new URL("../../design/katalog.json", import.meta.url), "utf8")) as KatalogJson);
const IRK = {
  arch_tuarek: { str: 65, hp: 65, dex: 60, int: 50, mp: 50 },
  tuarek: { str: 60, hp: 60, dex: 70, int: 50, mp: 50 },
  wrinkle_tuarek: { str: 50, hp: 50, dex: 70, int: 70, mp: 50 },
};
const bos = (g: Partial<Build>): Build => ({
  id: "x", characterId: null, ad: "", sinif: "rogue", irkTuru: "tuarek", level: 75, reb: 0, statlar: { str: 0, hp: 0, dex: 0, int: 0, mp: 0 },
  skiller: [0, 0, 0, 0], ekipman: {}, apGirdileri: {}, sablon: false, updatedAt: "", ...g,
});

describe("havuzlar ve skill sınırları", () => {
  it("stat: 10 + 3 × (min(lv,60) − 1) + 5 × (lv − 60) + 2 × reb (83'te)", () => {
    expect(havuzlar(bos({ level: 83, reb: 0 })).statToplam).toBe(302);
    expect(havuzlar(bos({ level: 83, reb: 3 })).statToplam).toBe(308);
    expect(havuzlar(bos({ level: 60 })).statToplam).toBe(187);
    expect(havuzlar(bos({ level: 1 })).statToplam).toBe(10);
  });
  it("skill: level 10'dan itibaren 2 × (level − 9); reb vermez", () => {
    expect(havuzlar(bos({ level: 9 })).skillToplam).toBe(0);
    expect(havuzlar(bos({ level: 10 })).skillToplam).toBe(2);
    expect(havuzlar(bos({ level: 83, reb: 5 })).skillToplam).toBe(148);
  });
  it("ağaç level kadar, üst skill 80 (Warrior 3. ağaç 83), master level − 60 en fazla 23", () => {
    expect(skillSiniri("rogue", 70, 0)).toBe(70);
    expect(skillSiniri("rogue", 83, 2)).toBe(80);
    expect(skillSiniri("warrior", 83, 2)).toBe(83);
    expect(skillSiniri("mage", 60, 3)).toBe(0);
    expect(skillSiniri("mage", 75, 3)).toBe(15);
    expect(skillSiniri("mage", 83, 3)).toBe(23);
  });
  it("kurallar game_rules satırlarından", () => {
    expect(kurallariOku([{ anahtar: "master_max", deger: 20 }, { anahtar: "agac_siniri", deger: { genel: 80, warrior_3: 83 } }])).toEqual({ ...VARSAYILAN_KURALLAR, masterMax: 20 });
    expect(kurallariOku([])).toEqual(VARSAYILAN_KURALLAR);
  });
});

describe("AP (prototipte doğrulanan değerler)", () => {
  const yay = kat.esyalar.get(263)!;
  const ilkDerece = kat.dereceler.get(263)![0][0];
  const b = bos({ statlar: { str: 0, hp: 0, dex: 30, int: 0, mp: 0 }, ekipman: { 0: { itemId: 263, arti: ilkDerece } } });
  it("Exceptional Iron Bow, DEX 100, level 75 → 432", () => {
    expect(yay.ad).toBe("Exceptional Iron Bow");
    const h = hesapla(b, IRK.tuarek, kat);
    expect(h.silah).toBe("bow");
    expect(h.ap).toBe(432);
  });
  it("Draki Legion Rogue Pauldrons ile 481; Wolf ve +15 DEX eklenince 649", () => {
    const omuz = { ...b, ekipman: { ...b.ekipman, 3: { itemId: 637, arti: 1 } } };
    expect(kat.esyalar.get(637)!.ad).toBe("Draki Legion Rogue Pauldrons");
    expect(hesapla(omuz, IRK.tuarek, kat).ap).toBe(481);
    expect(hesapla(omuz, IRK.tuarek, kat, { ...EK_YOK, wolf: true, ekStat: 15 }).ap).toBe(649);
  });
});

describe("örnek build'ler (prototipin gösterdiği değerler)", () => {
  const ornek = (ad: string) => buildler.find((x) => x.id === `b-${ad}`)!;
  it("KaraBey: Krowaz Warrior + Exceptional Raptor", () => {
    const h = hesapla(ornek("karabey"), IRK.arch_tuarek, kat);
    expect({ ap: h.ap, savunma: h.savunma, can: h.can, mana: h.mana }).toEqual({ ap: 2080, savunma: 881, can: 4690, mana: 4670 });
  });
  it("SessizOk: Mythril + Exceptional Iron Bow", () => {
    const h = hesapla(ornek("sessizok"), IRK.tuarek, kat);
    expect({ ap: h.ap, savunma: h.savunma, can: h.can, mana: h.mana }).toEqual({ ap: 1578, savunma: 557, can: 1872, mana: 2561 });
    expect(h.toplam).toMatchObject({ str: 120, hp: 90, dex: 345 });
  });
  it("AlevBüyü: Ron's + asa", () => {
    expect(hesapla(ornek("alevbuyu"), IRK.wrinkle_tuarek, kat).ap).toBe(101);
  });
});

describe("set bonusu", () => {
  const mythril = [...kat.setler.values()].find((s) => s.ad === "Mythril")!;
  it("Mythril tam set: +15 DEX, +8 HP stat, +400 can, +350 mana, +30 tüm dirençler", () => {
    expect(setBonusMetni(setBonusu(kat, "rogue", mythril, 31))).toBe("+8 HP stat · +15 DEX · +400 Can (HP) · +350 Mana (MP) · +30 tüm dirençler");
  });
  it("takılı parçalara göre: 5/5 aktif, 2 parça kombinasyonu tablodan", () => {
    const tam = ekipmanToplami(ornek5(), kat);
    expect(tam.setler).toHaveLength(1);
    expect(tam.setler[0]).toMatchObject({ maske: 31, parca: 5 });
    expect(tam.setten[11]).toBe(15);
  });
  function ornek5() {
    return buildler.find((x) => x.id === "b-sessizok")!;
  }
});

describe("sahip adlı eşyalar", () => {
  it("{ad} nick'le dolar", () => {
    const azagai = [...kat.esyalar.values()].find((e) => e.ad === "{ad}'s Azagai")!;
    expect(esyaAdi(azagai, "Toprakcan")).toBe("Toprakcan's Azagai");
  });
});
