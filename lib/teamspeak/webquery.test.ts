import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoAyarlar } from "@/lib/data/settings";
import { demoDuyurular } from "@/lib/data/announcements";
import { YETKI_YOK } from "@/lib/data/ortak";
import { type DemoDepo, yeniDemoDepo } from "@/lib/demo/depo";
import { profilId } from "@/lib/demo/fixtures";
import { duyuruyuTsyeGonder } from "./duyuru";
import { baytaSigdir, duyuruMetni, tsAyari, tsSunucuyaGonder } from "./webquery";

const ayar = { adres: "http://ts.ornek:10080", anahtar: "gizli", sunucuId: 1 };
const yanit = (status: number, govde: unknown) => new Response(JSON.stringify(govde), { status, headers: { "content-type": "application/json" } });

describe("TeamSpeak WebQuery", () => {
  it("ayar ortamdan; eksikse kapalı", () => {
    expect(tsAyari({})).toBeNull();
    expect(tsAyari({ TS3_WEBQUERY_URL: "http://ts:10080/", TS3_WEBQUERY_KEY: "k" })).toEqual({ adres: "http://ts:10080", anahtar: "k", sunucuId: 1 });
    expect(tsAyari({ TS3_WEBQUERY_URL: "http://ts", TS3_WEBQUERY_KEY: "k", TS3_SUNUCU_ID: "x" })?.sunucuId).toBe(1);
  });

  it("sendtextmessage'ı anahtar başlığıyla, sunucuya (targetmode=3) çağırır", async () => {
    const f = vi.fn(async (..._: unknown[]) => yanit(200, { body: [], status: { code: 0, message: "ok" } }));
    await tsSunucuyaGonder("Merhaba & hoş geldin", ayar, f as unknown as typeof fetch);
    const [url, secenek] = f.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/1/sendtextmessage");
    expect(Object.fromEntries(url.searchParams)).toEqual({ targetmode: "3", target: "1", msg: "Merhaba & hoş geldin" });
    expect(secenek.headers).toEqual({ "x-api-key": "gizli" });
  });

  it("hatalar kullanıcıya açık Türkçe mesaj", async () => {
    const dene = (f: () => Promise<Response>) => tsSunucuyaGonder("x", ayar, f as unknown as typeof fetch);
    await expect(dene(async () => { throw new TypeError("fetch failed"); })).rejects.toThrow("ulaşılamadı");
    await expect(dene(async () => yanit(401, {}))).rejects.toThrow("anahtarı geçersiz");
    await expect(dene(async () => yanit(200, { status: { code: 2568, message: "insufficient client permissions" } }))).rejects.toThrow("izni yok");
    await expect(dene(async () => yanit(200, { status: { code: 1024, message: "invalid serverID" } }))).rejects.toThrow("bulunamadı");
    await expect(dene(async () => new Response("<html>", { status: 502 }))).rejects.toThrow("HTTP 502");
    await expect(tsSunucuyaGonder("x", null)).rejects.toThrow("ayarlanmamış");
  });

  it("mesaj 1024 bayta sığdırılır (Türkçe harfler 2 bayt); BBCode enjeksiyonu etkisiz", () => {
    const uzun = baytaSigdir("ş".repeat(600));
    expect(new TextEncoder().encode(uzun).length).toBeLessThanOrEqual(1024);
    expect(uzun.endsWith("…")).toBe(true);
    expect(baytaSigdir("kısa")).toBe("kısa");
    expect(duyuruMetni("L4BEL", " CSW ", "[url=http://x]tıkla[/url] [b]x[/b]")).toBe("[b][L4BEL] CSW[/b]\n(url=http://x]tıkla(/url] (b]x(/b]");
  });
});

describe("duyuruyu TeamSpeak'e gönderme", () => {
  let depo: DemoDepo;
  const v = (nick: string) => { const b = { depo, kullaniciId: profilId(nick) }; return { duyurular: demoDuyurular(b), ayarlar: demoAyarlar(b) }; };
  const kullanici = (nick: string) => ({ profil: depo.profiller.find((p) => p.id === profilId(nick))!, karakter: null });
  beforeEach(() => { depo = yeniDemoDepo(); });

  it("üye gönderemez; mesaj hiç gitmez", async () => {
    const gonder = vi.fn(async () => {});
    await expect(duyuruyuTsyeGonder(v("GeceKuşu"), kullanici("GeceKuşu"), "d-ardream", gonder)).rejects.toThrow(YETKI_YOK);
    await expect(duyuruyuTsyeGonder(v("GeceKuşu"), null, "d-ardream", gonder)).rejects.toThrow(YETKI_YOK);
    expect(gonder).not.toHaveBeenCalled();
  });

  it("yetkili gönderir, gönderildi zamanı yazılır; gönderim başarısızsa yazılmaz", async () => {
    const gonder = vi.fn(async (_: string) => {});
    await duyuruyuTsyeGonder(v("DemirYumruk"), kullanici("DemirYumruk"), "d-ardream", gonder);
    expect(gonder.mock.calls[0][0]).toMatch(/^\[b\]\[L4BEL\] Yeni sunucularda Ardream yok\[\/b\]\n/);
    expect(depo.duyurular.find((d) => d.id === "d-ardream")?.tsGonderildiAt).not.toBeNull();

    const { TsHatasi } = await import("./webquery");
    const bozuk = vi.fn(async () => { throw new TsHatasi("TeamSpeak sunucusuna ulaşılamadı"); });
    await expect(duyuruyuTsyeGonder(v("DemirYumruk"), kullanici("DemirYumruk"), "d-juraid", bozuk)).rejects.toThrow("ulaşılamadı");
    expect(depo.duyurular.find((d) => d.id === "d-juraid")?.tsGonderildiAt).toBeNull();
  });
});
