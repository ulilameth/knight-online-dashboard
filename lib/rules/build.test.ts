import { describe, expect, it } from "vitest";
import { agaclar, buildler, irklar, oyunKuralSatirlari } from "@/lib/demo/fixtures";
import { demoKatalog } from "@/lib/demo/katalog";
import type { EsyaDetayi } from "@/lib/types";
import { type DenetlenecekBuild, buildDenetle } from "./build";
import { kurallariCoz } from "./kurallar";

const kurallar = kurallariCoz(oyunKuralSatirlari);
const katalog = demoKatalog();
const esyalar = new Map<number, EsyaDetayi>(katalog.esyalar.map((e) => [e.id, { ...e, dereceler: katalog.dereceler.get(e.id) ?? [] }]));
const denetle = (b: DenetlenecekBuild) =>
  buildDenetle(b, { kurallar, irk: irklar.find((i) => i.irkTuru === b.irkTuru) ?? null, esyalar, agaclar: agaclar[b.sinif] });

// Arch Tuarek Warrior, level 76: 267 stat, 134 skill puanı
const temel: DenetlenecekBuild = {
  sinif: "warrior", irkTuru: "arch_tuarek", level: 76, reb: 0,
  statlar: { str: 180, hp: 87, dex: 0, int: 0, mp: 0 }, skiller: [60, 40, 34, 0], ekipman: {},
};
const ilk = (b: DenetlenecekBuild) => denetle(b).hatalar;

describe("build denetimi", () => {
  it("demo verisindeki kayıtlı build'ler kurallara uyar", () => {
    for (const b of buildler) expect(denetle(b).hatalar, b.characterId ?? "").toEqual([]);
  });

  it("havuzu ve kullanılanı döner", () => {
    expect(denetle(temel)).toMatchObject({ hatalar: [], statHavuzu: 267, statKullanilan: 267, skillHavuzu: 134, skillKullanilan: 134 });
  });

  it("fazla stat ya da skill puanı kaydedilmez (level düşünce de)", () => {
    expect(ilk({ ...temel, level: 75 })).toEqual(expect.arrayContaining([
      "Stat puanı fazla: 267 dağıtıldı, bu levelde 262", "Skill puanı fazla: 134 dağıtıldı, bu levelde 132",
    ]));
  });

  it("bir stat ırk başlangıcıyla birlikte 255'i geçemez", () => {
    expect(ilk({ ...temel, statlar: { str: 191, hp: 76, dex: 0, int: 0, mp: 0 } })).toEqual(["STR en fazla 255 olabilir (65 + 191)"]);
  });

  it("ağaç sınırı ve master kilidi", () => {
    expect(ilk({ ...temel, skiller: [77, 40, 17, 0] })).toEqual(["Attack bu levelde en fazla 76"]);
    expect(ilk({ ...temel, level: 60, statlar: { str: 100, hp: 87, dex: 0, int: 0, mp: 0 }, skiller: [50, 40, 10, 2] }))
      .toEqual(["Master level 60'tan sonra açılır"]);
    expect(ilk({ ...temel, skiller: [60, 40, 10, 24] })).toEqual(["Master bu levelde en fazla 16"]);
  });

  it("ırk sınıfa uymalı; reb yalnızca 83'te", () => {
    expect(ilk({ ...temel, irkTuru: "wrinkle_tuarek" })).toContain("Wrinkle Tuarek bu sınıfı seçemez");
    expect(ilk({ ...temel, irkTuru: null })).toContain("Irk seçilmeli");
    expect(ilk({ ...temel, reb: 2 })).toEqual(["Reb yalnızca level 83'te verilir"]);
    expect(ilk({ ...temel, level: 84 })).toContain("Level 1 ile 83 arası olmalı");
  });

  it("eşya: yuva, sınıf ve artı denetlenir; eksik stat ve level yalnızca uyarı", () => {
    const priestSilahi = katalog.esyalar.find((e) => e.siniflar.length === 1 && e.siniflar[0] === "priest" && e.yuvalar.includes("silah"))!;
    const kask = katalog.esyalar.find((e) => e.yuvalar.includes("kask") && e.siniflar.includes("warrior") && katalog.dereceler.has(e.id))!;
    expect(ilk({ ...temel, ekipman: { 0: { itemId: priestSilahi.id, arti: 1 } } })).toContain(`${priestSilahi.ad} bu sınıfa uygun değil`);
    expect(ilk({ ...temel, ekipman: { 0: { itemId: kask.id, arti: 1 } } })).toContain(`${kask.ad} bu yuvaya takılmaz`);
    expect(ilk({ ...temel, ekipman: { 2: { itemId: 999_999, arti: 1 } } })).toEqual(["Katalogda olmayan eşya: 999999"]);
    expect(ilk({ ...temel, ekipman: { 19: { itemId: kask.id, arti: 1 } } })).toEqual(["Bilinmeyen ekipman yuvası: 19"]);
    expect(ilk({ ...temel, ekipman: { 2: { itemId: kask.id, arti: 30 } } })).toEqual([`${kask.ad} için +30 yok`]);

    // Holy Knight Portu Boots (Kurian) +7: level 75, STR 158, HP 88, MP 103 ister
    const kurian: DenetlenecekBuild = { ...temel, sinif: "kurian", irkTuru: "kurian", level: 70, statlar: { str: 80, hp: 0, dex: 0, int: 0, mp: 0 }, skiller: [0, 0, 0, 0], ekipman: { 6: { itemId: 393, arti: 7 } } };
    expect(denetle(kurian)).toMatchObject({
      hatalar: [],
      uyarilar: ["Holy Knight Portu Boots level 75 ister", "Holy Knight Portu Boots STR 158 ister (sende 145)", "Holy Knight Portu Boots HP 88 ister (sende 65)", "Holy Knight Portu Boots MP 103 ister (sende 50)"],
    });
  });
});
