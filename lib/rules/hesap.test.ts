import { describe, expect, it } from "vitest";
import { buildler, irklar } from "@/lib/demo/fixtures";
import { demoKatalog } from "@/lib/demo/katalog";
import type { Build, EsyaDetayi } from "@/lib/types";
import { YUVALAR } from "./build";
import { DIRENCLER, hesapGirdileri, hesapla } from "./hesap";
import referans from "./hesap.referans.json";

const k = demoKatalog();
const esyalar = new Map<number, EsyaDetayi>(k.esyalar.map((e) => [e.id, { ...e, dereceler: k.dereceler.get(e.id) ?? [] }]));
const bag = (irkTuru: string | null) => ({ irk: irklar.find((i) => i.irkTuru === irkTuru) ?? null, esyalar, setBonuslari: k.setBonuslari });
const hesap = (b: Pick<Build, "sinif" | "irkTuru" | "level" | "statlar" | "ekipman">, girdi?: Parameters<typeof hesapla>[2]) =>
  hesapla({ reb: 0, ...b }, bag(b.irkTuru), girdi);

describe("otomatik hesap", () => {
  // Referans: design/prototype.html'deki KO Bugda hesaplayıcısı (derived) aynı build'lerle çalıştırıldı;
  // 300 rastgele build'de (150'si set bonuslu, 61'i Kurian) birebir aynı çıktı. Burada her sınıftan örnekler.
  it.each(referans.map((r, i) => [`${i + 1}. ${r.build.sinif} lv${r.build.level}`, r] as const))("prototiple aynı: %s", (_, r) => {
    const h = hesap(r.build as unknown as Build, r.girdi);
    expect({ ap: h.ap, can: h.can, mana: h.mana, savunma: h.savunma, res: DIRENCLER.map((d) => h.direncler[d]) }).toEqual(r.beklenen);
  });

  it("tam Holy Knight Portu seti Kurian'da KURIAN tablosundan bonus verir; eksik parça tam eşleşme ister", () => {
    const yuvaNo = (id: number) => String(YUVALAR.indexOf(esyalar.get(id)!.yuvalar[0] as (typeof YUVALAR)[number]));
    const ekipman = Object.fromEntries([393, 394, 395, 396, 397].map((id) => [yuvaNo(id), { itemId: id, arti: 1 }]));
    expect(Object.keys(ekipman).sort()).toEqual(["2", "3", "4", "5", "6"]);
    const h = hesap({ sinif: "kurian", irkTuru: "kurian", level: 80, statlar: { str: 150, hp: 100, dex: 0, int: 0, mp: 20 }, ekipman });
    expect(h.ekipman.setler).toEqual([expect.objectContaining({ tablo: "KURIAN_HOLY_KNIGHT", maske: 31, parca: 5 })]);
    expect(h.ekipman.setler[0].bonus).not.toBeNull();
    expect(h.ekipman.takili).toBe(5);
  });

  it("demo build'leri hesaplanır; ana stat sınıfa ve silaha göre", () => {
    for (const b of buildler) {
      const h = hesapla(b, bag(b.irkTuru));
      expect(h.ap).toBeGreaterThan(3);
      expect(h.can).toBeGreaterThan(0);
      expect(h.anaStat).toBe(b.sinif === "rogue" ? "dex" : "str");
    }
  });

  it("can 14.000'i geçmez; eşyasız karakterde toplam stat = ırk + dağıtılan", () => {
    const h = hesap({ sinif: "warrior", irkTuru: "arch_tuarek", level: 83, statlar: { str: 0, hp: 190, dex: 0, int: 0, mp: 0 }, ekipman: {} });
    expect(h.toplamStatlar).toEqual({ str: 65, hp: 255, dex: 60, int: 50, mp: 50 });
    expect(h.can).toBeLessThanOrEqual(14000);
    // Silahsız: silah AP'si en az 3 sayılır; STR 150'nin altında olduğu için taban AP yok
    expect(h.ap).toBe(Math.floor(0.005 * 3 * (65 + 40) + 0.00032 * 3 * 83 * 65 + 3));
  });

  it("ap_girdileri bozuk ya da eksikse varsayılan", () => {
    expect(hesapGirdileri(null)).toEqual({ wes: false, wolf: false, ekStat: 0, ekYuzde: 0 });
    expect(hesapGirdileri({ wes: true, ekStat: "5", ekYuzde: 7 })).toEqual({ wes: true, wolf: false, ekStat: 0, ekYuzde: 7 });
  });
});
