import { describe, expect, it } from "vitest";
import { csvAyristir, esyaDogrula, jsonAyristir } from "./ice-aktar";

const temel = { ad: " Klan Pelerini ", kategori: "Wings", yuvalar: ["kanat", "kanat"], siniflar: [], derece: "cospre" as const };

describe("eşya doğrulama", () => {
  it("kırpar, tekrarları atar, sıfır değerleri yazmaz", () => {
    const d = esyaDogrula({ ...temel, dereceler: [{ arti: 2, degerler: { BonusStrength: 5, Defense: 0 } }, { arti: 1, degerler: {} }] });
    expect(d.hatalar).toEqual([]);
    expect(d.esya).toMatchObject({ ad: "Klan Pelerini", yuvalar: ["kanat"], etki: null, dereceler: [{ arti: 1, degerler: {} }, { arti: 2, degerler: { BonusStrength: 5 } }] });
  });

  it("yuva, sınıf, derece, artı ve değerleri denetler", () => {
    const d = esyaDogrula({
      ...temel, ad: "", yuvalar: ["sirt"], siniflar: ["paladin" as never], derece: "efsane" as never,
      dereceler: [{ arti: 32, degerler: {} }, { arti: 1, degerler: { "Bonus Str": 1, Defense: 1.5 } }, { arti: 1, degerler: {} }],
    });
    expect(d.hatalar).toEqual([
      "Ad 1-80 karakter olmalı", "Bilinmeyen yuva: sirt", "Bilinmeyen sınıf: paladin", "Derece normal, set, unique, rare, draki, cospre olmalı",
      "Artı 0 ile 31 arası olmalı (32)", "+1: geçersiz alan adı \"Bonus Str\"", "+1 Defense: tam sayı olmalı", "+1 iki kez verilmiş",
    ]);
  });
});

describe("JSON içe aktarma", () => {
  it("dizi ya da {esyalar}; liste alanları metin de olabilir; hatalı eşya numarasıyla bildirilir", () => {
    const r = jsonAyristir(JSON.stringify({ esyalar: [
      { ad: "A", kategori: "Ring", yuvalar: "yuzuk", siniflar: "warrior|rogue", derece: "unique", dereceler: [{ arti: 0, degerler: { BonusHp: 50 } }] },
      { ad: "B", kategori: "Ring", yuvalar: ["omuz"], derece: "unique" },
    ] }));
    expect(r.esyalar).toEqual([expect.objectContaining({ ad: "A", yuvalar: ["yuzuk"], siniflar: ["warrior", "rogue"], dereceler: [{ arti: 0, degerler: { BonusHp: 50 } }] })]);
    expect(r.hatalar).toEqual(["Eşya 2: Bilinmeyen yuva: omuz"]);
    expect(jsonAyristir("{").hatalar).toEqual(["Geçerli JSON değil"]);
    expect(jsonAyristir("{}").hatalar[0]).toMatch(/dizi/);
  });
});

describe("CSV içe aktarma", () => {
  it("her artı ayrı satır, id ya da adla birleşir; tırnak, noktalı virgül ve BOM", () => {
    const csv = "﻿id;ad;kategori;yuvalar;siniflar;derece;etki;arti;AttackPower;RequiredLevel\n"
      + "1000005;\"Kılıç; L4BEL\";Sword - 1H;silah|ikinci;warrior;unique;\"\"\"Kanlı\"\" etki\";0;100;60\n"
      + "1000005;\"Kılıç; L4BEL\";Sword - 1H;silah|ikinci;warrior;unique;;1;105;60\n"
      + ";Yüzük;Ring;yuzuk;;rare;;;;\n";
    const r = csvAyristir(csv);
    expect(r.hatalar).toEqual([]);
    expect(r.esyalar).toEqual([
      expect.objectContaining({ id: 1000005, ad: "Kılıç; L4BEL", yuvalar: ["silah", "ikinci"], etki: "\"Kanlı\" etki",
        dereceler: [{ arti: 0, degerler: { AttackPower: 100, RequiredLevel: 60 } }, { arti: 1, degerler: { AttackPower: 105, RequiredLevel: 60 } }] }),
      expect.objectContaining({ ad: "Yüzük", siniflar: [], dereceler: [] }),
    ]);
  });

  it("eksik sütun ve sayı olmayan değer satır numarasıyla", () => {
    expect(csvAyristir("ad,kategori\nA,B\n").hatalar).toEqual(["Eksik sütun: yuvalar, siniflar, derece"]);
    expect(csvAyristir("ad,kategori,yuvalar,siniflar,derece,arti,Defense\nA,Helmet,kask,,normal,1,çok\n").hatalar).toEqual(["Satır 2: Defense sayı değil (\"çok\")"]);
  });
});
