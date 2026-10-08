import { describe, expect, it } from "vitest";
import { etkinlikTurleri, karakterler } from "@/lib/demo/fixtures";
import { tsi } from "@/lib/time";
import type { Etkinlik, Karakter, Yoklama } from "@/lib/types";
import { etkinlikFormunuCoz, etkinlikGruplari, etkinliktenForm, isaretHaritasi, varsayilanEtkinlik, yoklamaKadrosu } from "./etkinlik";

const e = (id: string, an: string, bitis: string | null = null): Etkinlik => ({ id, tur: "bdw", baslik: id, baslangic: tsi(an), bitis: bitis && tsi(bitis), aciklama: null, scheduleId: null, olusturan: null });
const y = (eventId: string, characterId: string, durum: Yoklama["durum"]): Yoklama => ({ eventId, characterId, durum, isaretleyen: null, updatedAt: "" });
const form = { tur: "csw", baslik: " Pazar CSW ", tarih: "2026-11-22", saat: "20:30", sure: "90", aciklama: "" };

describe("etkinlik formu", () => {
  it("TSİ tarih ve saatten başlangıç, süreden bitiş", () => {
    expect(etkinlikFormunuCoz(form, etkinlikTurleri)).toEqual({
      tur: "csw", baslik: "Pazar CSW", baslangic: "2026-11-22T17:30:00.000Z", bitis: "2026-11-22T19:00:00.000Z", aciklama: null,
    });
    expect(etkinlikFormunuCoz({ ...form, sure: "" }, etkinlikTurleri)).toMatchObject({ bitis: null });
  });
  it("hatalı alanlar", () => {
    expect(etkinlikFormunuCoz({ ...form, tur: "yok" }, etkinlikTurleri)).toEqual({ hata: "Etkinlik türünü seç" });
    expect(etkinlikFormunuCoz({ ...form, baslik: "  " }, etkinlikTurleri)).toEqual({ hata: "Başlık 1-120 karakter olmalı" });
    expect(etkinlikFormunuCoz({ ...form, tarih: "22.11.2026" }, etkinlikTurleri)).toEqual({ hata: "Tarih geçersiz" });
    expect(etkinlikFormunuCoz({ ...form, saat: "24:00" }, etkinlikTurleri)).toEqual({ hata: "Saat SS:DD biçiminde olmalı" });
    expect(etkinlikFormunuCoz({ ...form, sure: "-5" }, etkinlikTurleri)).toEqual({ hata: "Süre 0-1440 dakika olmalı" });
    expect(etkinlikFormunuCoz({ ...form, sure: "1,5" }, etkinlikTurleri)).toEqual({ hata: "Süre 0-1440 dakika olmalı" });
  });
  it("düzenlemede form geri doldurulur", () => {
    expect(etkinliktenForm(e("x", "2026-11-22T20:30", "2026-11-22T22:00"))).toEqual({ tur: "bdw", baslik: "x", tarih: "2026-11-22", saat: "20:30", sure: "90", aciklama: "" });
    // Gece yarısından sonra TSİ günü
    expect(etkinliktenForm(e("x", "2026-11-23T00:30")).tarih).toBe("2026-11-23");
  });
});

describe("yoklama kadrosu", () => {
  const k = (id: string, ad: string, rutbe: Karakter["rutbe"], ek: Partial<Karakter> = {}): Karakter => ({ ...karakterler[0], id, ad, rutbe, anaKarakter: true, durum: "aktif", ...ek });
  const kadro = [k("1", "Zeyn", "uye"), k("2", "Ali", "uye"), k("3", "Lider", "lider"), k("4", "Giden", "uye", { durum: "ayrildi" }), k("5", "Yan", "uye", { anaKarakter: false }), k("6", "Eski", "subay", { durum: "ayrildi" })];
  it("ayrılmamış ana karakterler + o etkinlikte işaretlenmişler; rütbe ve nick sırası", () => {
    expect(yoklamaKadrosu(kadro, [y("a", "6", "katildi"), y("b", "4", "yok")], "a").map((x) => x.ad)).toEqual(["Lider", "Eski", "Ali", "Zeyn"]);
  });
  it("işaret haritası", () => {
    expect(isaretHaritasi([y("a", "1", "gec"), y("b", "1", "yok")], "a")).toEqual({ "1": "gec" });
  });
});

describe("etkinlik listesi", () => {
  const liste = [e("eski", "2026-11-10T21:00"), e("dun", "2026-11-21T21:00"), e("simdi", "2026-11-22T20:00"), e("yarin", "2026-11-23T21:00"), e("y2", "2026-11-24T21:00"), e("y3", "2026-11-25T21:00"), e("y4", "2026-11-26T21:00"), e("y5", "2026-11-27T21:00")];
  const su = new Date(tsi("2026-11-22T20:15"));
  it("başlamış olan geçmişte (yoklaması açık), yaklaşanlar en çok 4", () => {
    const g = etkinlikGruplari(liste, su);
    expect(g.yaklasan.map((x) => x.id)).toEqual(["yarin", "y2", "y3", "y4"]);
    expect(g.gecmis.map((x) => x.id)).toEqual(["simdi", "dun", "eski"]);
    expect(varsayilanEtkinlik(g)?.id).toBe("simdi");
  });
  it("geçmiş yoksa ilk yaklaşan seçilir", () => {
    expect(varsayilanEtkinlik(etkinlikGruplari(liste.slice(3), su))?.id).toBe("yarin");
    expect(varsayilanEtkinlik(etkinlikGruplari([], su))).toBeUndefined();
  });
});
