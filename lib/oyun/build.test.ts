import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { irklar } from "@/lib/demo/fixtures";
import {
  artiSec, bosTaslak, buildtenTaslak, esyaTak, eksikGereksinim, katalogListesi, seciciEsyalari, seciciSetleri, setTak, sinifDegistir,
  skillAdim, skillYaz, statAdim, statYaz, taslakDuzelt, taslakHatasi, taslaktanBuild, yuvaBosalt, yuvalarOf, yuvaUyarisi, ZIRH_YUVALARI,
} from "./build";
import { VARSAYILAN_KURALLAR as K, havuzlar } from "./hesap";
import { type KatalogJson, kataloguHazirla } from "./katalog";

const kat = kataloguHazirla(JSON.parse(readFileSync(new URL("../../design/katalog.json", import.meta.url), "utf8")) as KatalogJson);
const tuarek = irklar.find((r) => r.irkTuru === "tuarek")!;
const rogue = (lv = 75) => taslakDuzelt(bosTaslak("rogue", lv), irklar, "karus");

describe("taslak", () => {
  it("ırk sınıfa ve tarafa göre; reb yalnızca 83'te; level 1-83", () => {
    expect(rogue().irkTuru).toBe("tuarek");
    expect(taslakDuzelt({ ...rogue(), irkTuru: "wrinkle_tuarek" }, irklar, "karus").irkTuru).toBe("tuarek");
    expect(taslakDuzelt(rogue(), irklar, "el_morad").irkTuru).not.toBe("tuarek");
    expect(taslakDuzelt({ ...rogue(80), reb: 4 }, irklar, "karus").reb).toBe(0);
    expect(taslakDuzelt({ ...rogue(), level: 99 }, irklar, "karus").level).toBe(83);
    expect(sinifDegistir({ ...rogue(), skiller: [5, 5, 5, 0] }, "mage").skiller).toEqual([0, 0, 0, 0]);
  });
  it("kayıtlı build'den ve build'e: ekler apGirdileri'nde", () => {
    const t = { ...rogue(), ekler: { wes: true, wolf: false, ekStat: 12, ekYuzde: 0 } };
    const b = taslaktanBuild(t, "SessizOk");
    expect(b.apGirdileri).toEqual({ wes: true, wolf: false, ekStat: 12, ekYuzde: 0 });
    expect(buildtenTaslak({ ...b, apGirdileri: { wes: true, ekStat: -3, ekYuzde: "x" } }).ekler).toEqual({ wes: true, wolf: false, ekStat: 0, ekYuzde: 0 });
  });
});

describe("stat ve skill yazma", () => {
  it("toplam değer yazılır; başlangıcın altına, 255'in ve kalan puanın üstüne çıkmaz", () => {
    const t = rogue(); // 10 + 3×59 + 5×15 = 262 puan
    expect(statYaz(t, tuarek, "dex", 200, false, K).t.statlar.dex).toBe(130);
    expect(statYaz(t, tuarek, "dex", 300, false, K).t).toBe(t); // yazarken aralık dışı: bekle
    expect(statYaz(t, tuarek, "dex", 300, true, K)).toMatchObject({ t: { statlar: { dex: 185 } }, uyari: "DEX en fazla 255" });
    expect(statYaz(t, tuarek, "dex", 10, true, K)).toMatchObject({ t: { statlar: { dex: 0 } }, uyari: "DEX başlangıç statı 70, daha aşağı inemez" });
    const dolu = statYaz(t, tuarek, "dex", 255, true, K).t; // 185 kullanıldı, 77 kaldı
    expect(statYaz(dolu, tuarek, "str", 255, true, K)).toMatchObject({ t: { statlar: { str: 77 } }, uyari: "STR en fazla 137 olabilir: kalan stat puanı bu kadar" });
  });
  it("− / + düğmeleri", () => {
    const t = rogue(1); // 10 puan
    expect(statAdim(t, tuarek, "str", -1, K)).toBe(t);
    let x = t;
    for (let i = 0; i < 12; i++) x = statAdim(x, tuarek, "str", 1, K);
    expect(x.statlar.str).toBe(10);
  });
  it("skill: ağaç sınırı ve kalan puan; master 60'tan sonra", () => {
    const t = rogue(70); // 122 skill puanı
    expect(skillYaz(t, 0, 80, true, K, "Archery")).toMatchObject({ t: { skiller: [70, 0, 0, 0] }, uyari: "Archery bu levelde en fazla 70" });
    const x = skillYaz(skillYaz(t, 0, 70, true, K, "Archery").t, 1, 70, true, K, "Assassin");
    expect(x).toMatchObject({ t: { skiller: [70, 52, 0, 0] }, uyari: "Assassin en fazla 52 olabilir: kalan skill puanı bu kadar" });
    expect(skillAdim(rogue(60), 3, 1, K).skiller[3]).toBe(0);
    expect(skillAdim(rogue(61), 3, 1, K).skiller[3]).toBe(1);
  });
  it("level düşünce kaydetmeyi engelleyen hata", () => {
    const t = statYaz(rogue(75), tuarek, "dex", 255, true, K).t;
    const dusuk = { ...skillYaz(t, 0, 70, true, K, "Archery").t, level: 40 };
    expect(havuzlar(dusuk, K).statKalan).toBeLessThan(0);
    expect(taslakHatasi(dusuk, K, ["Archery", "Assassin", "Explore", "Master"])).toBe("Dağıtılan puan bu level için fazla: 58 stat, 8 skill düşür. Ağaç sınırı: Archery en fazla 40.");
    expect(taslakHatasi(rogue(), K, ["a", "b", "c", "d"])).toBeNull();
  });
});

describe("ekipman", () => {
  it("eşya tak: önceki artı varsa korunur; derece seç; boşalt", () => {
    let t = esyaTak(rogue(), kat, 0, 263);
    expect(t.ekipman["0"]).toEqual({ itemId: 263, arti: 1 });
    t = artiSec(t, 0, 2);
    expect(esyaTak(t, kat, 0, 263).ekipman["0"].arti).toBe(2);
    expect(yuvaBosalt(t, [0]).ekipman).toEqual({});
  });
  it("set tak: beş parça kendi yuvalarına; sınıf uymuyorsa hata", () => {
    const r = setTak(rogue(), kat, "321,322,323,324,325", "Rogue");
    expect("t" in r && ZIRH_YUVALARI.map((y) => r.t.ekipman[String(y)]?.itemId)).toEqual([323, 325, 324, 322, 321]);
    expect(setTak(taslakDuzelt(bosTaslak("mage", 75), irklar, "karus"), kat, "321,322,323,324,325", "Mage")).toEqual({ hata: "Mythril seti Mage için değil" });
  });
  it("küpe ve yüzük iki yuvaya girer", () => {
    expect(yuvalarOf(kat.esyalar.get(6)!)).toEqual([8, 9]);
  });
  it("gereksinim ve uygunluk uyarısı", () => {
    const t = esyaTak(rogue(), kat, 0, 263);
    expect(eksikGereksinim(kat, kat.esyalar.get(263)!, 1, { str: 60, hp: 60, dex: 70, int: 50, mp: 50 })).toEqual(["DEX 164 (sende 70)"]);
    expect(yuvaUyarisi(kat, t, tuarek, 0)).toEqual({ kotu: true, metin: "Gerekli: DEX 164 (sende 70)" });
    expect(yuvaUyarisi(kat, statYaz(t, tuarek, "dex", 170, true, K).t, tuarek, 0)).toEqual({ kotu: false, metin: null });
    expect(yuvaUyarisi(kat, { ...t, sinif: "mage" }, tuarek, 0)).toEqual({ kotu: true, metin: "Sınıfına ya da levelına uygun değil" });
  });
  it("seçici listeleri sınıfa, yuvaya, aramaya ve levela göre", () => {
    const yay = seciciEsyalari(kat, rogue(), 0, "iron bow", false);
    expect(yay.map((e) => e.id)).toContain(263);
    expect(yay.every((e) => e.yuvalar.includes("silah"))).toBe(true);
    expect(seciciEsyalari(kat, rogue(1), 0, "", true).length).toBeLessThan(seciciEsyalari(kat, rogue(1), 0, "", false).length);
    const setler = seciciSetleri(kat, rogue(), "mythril", false);
    expect(setler.map((s) => s.ad)).toContain("Mythril");
    expect(katalogListesi(kat, "mage", "", "silah", "").every((e) => e.yuvalar.includes("silah") && (!e.siniflar.length || e.siniflar.includes("mage")))).toBe(true);
  });
});

describe("sunucu doğrulaması", () => {
  const agac = ["Archery", "Assassin", "Explore", "Master"];
  it("geçerli taslak; bozuk alanlar reddedilir", async () => {
    const { taslakDogrula } = await import("./build");
    const t = statYaz(esyaTak(rogue(), kat, 0, 263), tuarek, "dex", 170, true, K).t;
    expect(taslakDogrula(t, tuarek, kat, K, agac)).toBeNull();
    expect(taslakDogrula({ ...t, reb: 2 }, tuarek, kat, K, agac)).toBe("Level 1-83, reb yalnızca 83'te");
    expect(taslakDogrula({ ...t, statlar: { ...t.statlar, dex: 200 } }, tuarek, kat, K, agac)).toBe("Statlar başlangıç ile 255 arasında olmalı");
    expect(taslakDogrula({ ...t, ekipman: { "2": { itemId: 263, arti: 1 } } }, tuarek, kat, K, agac)).toBe("Kask: eşya bu yuvaya takılamaz");
    expect(taslakDogrula({ ...t, ekipman: { "0": { itemId: 263, arti: 99 } } }, tuarek, kat, K, agac)).toBe("Silah: derece geçersiz");
    expect(taslakDogrula({ ...t, ekipman: { "0": { itemId: 999999, arti: 1 } } }, tuarek, kat, K, agac)).toBe("Silah: eşya bu yuvaya takılamaz");
  });
});

describe("taslak karşılaştırma", () => {
  it("ekipman sırası önemsiz, her alan sayılır", async () => {
    const { taslakAyni } = await import("./build");
    const a = esyaTak(esyaTak(rogue(), kat, 0, 263), kat, 8, 6), b = esyaTak(esyaTak(rogue(), kat, 8, 6), kat, 0, 263);
    expect(taslakAyni(a, b)).toBe(true);
    expect(taslakAyni(a, artiSec(b, 0, 2))).toBe(false);
    expect(taslakAyni(a, { ...a, ekler: { ...a.ekler, wolf: true } })).toBe(false);
    expect(taslakAyni(a, statAdim(a, tuarek, "dex", 1, K))).toBe(false);
  });
});
