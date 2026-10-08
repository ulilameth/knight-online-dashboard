import http from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
import { type HttpIstemcisi, TS_MESAJ_SINIRI, kopyaMetni, nodeIstemcisi, tsAyari, tsGonder, tsMesaji } from "./index";

const ayar = { url: "https://ts.ornek:10443", anahtar: "gizli", sunucu: 1 };
const yanit = (status: number, govde: unknown): HttpIstemcisi => async () => ({ status, govde: typeof govde === "string" ? govde : JSON.stringify(govde) });

describe("TeamSpeak WebQuery", () => {
  it("ayar: adres ve anahtar yoksa kapalı; sondaki / atılır", () => {
    expect(tsAyari({})).toBeNull();
    expect(tsAyari({ TS3_WEBQUERY_URL: "https://ts.ornek:10443" })).toBeNull();
    expect(tsAyari({ TS3_WEBQUERY_URL: "https://ts.ornek:10443/", TS3_WEBQUERY_KEY: " k " })).toEqual({ url: "https://ts.ornek:10443", anahtar: "k", sunucu: 1 });
    expect(tsAyari({ TS3_WEBQUERY_URL: "http://x:10080", TS3_WEBQUERY_KEY: "k", TS3_SANAL_SUNUCU: "2" })?.sunucu).toBe(2);
    expect(tsAyari({ TS3_WEBQUERY_URL: "http://x:10080", TS3_WEBQUERY_KEY: "k", TS3_SANAL_SUNUCU: "abc" })?.sunucu).toBe(1);
  });

  it("sunucudaki herkese sendtextmessage gönderir", async () => {
    const istemci = vi.fn(yanit(200, { body: [], status: { code: 0, message: "ok" } }));
    expect(await tsGonder(ayar, "merhaba", istemci)).toEqual({ ok: true });
    const [url, istek] = istemci.mock.calls[0];
    expect(url).toBe("https://ts.ornek:10443/1/sendtextmessage");
    expect(istek.headers["x-api-key"]).toBe("gizli");
    expect(JSON.parse(istek.body)).toEqual({ targetmode: 3, target: 1, msg: "merhaba" });
  });

  it("anahtar hatası, TS hatası ve ulaşılamama açık mesajla döner", async () => {
    expect(await tsGonder(ayar, "x", yanit(401, "Unauthorized"))).toMatchObject({ ok: false, hata: expect.stringContaining("anahtarı geçersiz") });
    expect(await tsGonder(ayar, "x", yanit(200, { status: { code: 5122, message: "invalid apikey" } }))).toMatchObject({ ok: false, hata: expect.stringContaining("anahtarı geçersiz") });
    expect(await tsGonder(ayar, "x", yanit(400, { status: { code: 1538, message: "invalid parameter" } }))).toEqual({ ok: false, hata: "TeamSpeak mesajı reddetti: invalid parameter" });
    expect(await tsGonder(ayar, "x", yanit(502, "<html>"))).toEqual({ ok: false, hata: "TeamSpeak mesajı reddetti: HTTP 502" });
    expect(await tsGonder(ayar, "x", async () => { throw new Error("ECONNREFUSED"); })).toMatchObject({ ok: false, hata: expect.stringContaining("ulaşılamadı") });
  });

  it("node:http istemcisi gerçek bir sunucuya POST atar (fetch'in reddettiği 10080 gibi portlarda da çalışır)", async () => {
    const gelen: { yol?: string; anahtar?: string; govde: string } = { govde: "" };
    const sunucu = http.createServer((q, r) => {
      q.on("data", (c) => { gelen.govde += c; });
      q.on("end", () => {
        Object.assign(gelen, { yol: q.url, anahtar: q.headers["x-api-key"] });
        r.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ body: [], status: { code: 0, message: "ok" } }));
      });
    });
    await new Promise<void>((coz) => sunucu.listen(0, "127.0.0.1", coz));
    const port = (sunucu.address() as AddressInfo).port;
    try {
      expect(await tsGonder({ url: `http://127.0.0.1:${port}`, anahtar: "k", sunucu: 1 }, "Merhaba ğüşİ")).toEqual({ ok: true });
      expect(gelen).toEqual({ yol: "/1/sendtextmessage", anahtar: "k", govde: JSON.stringify({ targetmode: 3, target: 1, msg: "Merhaba ğüşİ" }) });
    } finally {
      sunucu.close();
    }
    await expect(nodeIstemcisi(`http://127.0.0.1:${port}/x`, { headers: {}, body: "", zamanAsimiMs: 500 })).rejects.toThrow();
  });

  it("mesaj: kalın başlık, uzun metin 1024 karaktere kısaltılır", () => {
    expect(tsMesaji("L4BEL", " Pazar CSW ", "20:15 toplanma")).toBe("[b]L4BEL · Pazar CSW[/b]\n20:15 toplanma");
    const uzun = tsMesaji("L4BEL", "Başlık", "a".repeat(3000));
    expect(uzun.length).toBe(TS_MESAJ_SINIRI);
    expect(uzun.endsWith("…")).toBe(true);
    expect(kopyaMetni(" Başlık ", "Metin\n")).toBe("Başlık\n\nMetin");
  });
});
