import { describe, expect, it } from "vitest";
import { oyunKuralSatirlari } from "@/lib/demo/fixtures";
import { agacSiniri, kurallariCoz, skillHavuzu, statHavuzu } from "./kurallar";

const k = kurallariCoz(oyunKuralSatirlari);

describe("oyun kuralları", () => {
  it("game_rules satırlarını çözer, doğrulanmamışları listeler", () => {
    expect(k).toMatchObject({ statPerLevel: 3, statPerLevel60Ustu: 5, statCap: 255, agacSiniri: { genel: 80, warrior_3: 83 } });
    expect(k.dogrulanmamis).toEqual(["master_level", "master_max"]);
  });

  it("eksik ya da bozuk kural sessizce varsayılana düşmez", () => {
    expect(() => kurallariCoz(oyunKuralSatirlari.filter((s) => s.anahtar !== "stat_cap"))).toThrow("'stat_cap' kuralı eksik");
    expect(() => kurallariCoz(oyunKuralSatirlari.map((s) => s.anahtar === "stat_per_level" ? { ...s, deger: "3" } : s))).toThrow("tam sayı");
    expect(() => kurallariCoz(oyunKuralSatirlari.map((s) => s.anahtar === "agac_siniri" ? { ...s, deger: { warrior_3: 83 } } : s))).toThrow("agac_siniri");
  });

  it("stat havuzu: oluşturmada 10, 60'a kadar level başına 3, sonra 5, reb başına 2 (yalnızca 83'te)", () => {
    expect(statHavuzu(k, 1, 0)).toBe(10);
    expect(statHavuzu(k, 60, 0)).toBe(10 + 3 * 59);
    expect(statHavuzu(k, 76, 0)).toBe(267);
    expect(statHavuzu(k, 83, 0)).toBe(302);
    expect(statHavuzu(k, 83, 10)).toBe(322);
    expect(statHavuzu(k, 80, 5)).toBe(statHavuzu(k, 80, 0));
  });

  it("skill havuzu level 10'da başlar, level başına 2, reb vermez", () => {
    expect(skillHavuzu(k, 9)).toBe(0);
    expect(skillHavuzu(k, 10)).toBe(2);
    expect(skillHavuzu(k, 83)).toBe(148);
  });

  it("ağaç sınırı: level kadar, üst skill 80 (Warrior 3. ağaç 83); master 60'tan sonra en fazla 23", () => {
    expect(agacSiniri(k, "mage", 1, 45)).toBe(45);
    expect(agacSiniri(k, "mage", 3, 83)).toBe(80);
    expect(agacSiniri(k, "warrior", 3, 83)).toBe(83);
    expect(agacSiniri(k, "warrior", 2, 83)).toBe(80);
    expect(agacSiniri(k, "rogue", 4, 60)).toBe(0);
    expect(agacSiniri(k, "rogue", 4, 61)).toBe(1);
    expect(agacSiniri(k, "rogue", 4, 83)).toBe(23);
  });
});
