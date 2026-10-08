// TeamSpeak 3 WebQuery (sunucu 3.12+): duyuruyu sunucudaki herkese metin mesajı olarak gönderir.
// Yalnızca sunucu tarafında çalışır; adres ve API anahtarı ortam değişkenlerinden okunur (docs/PLAN.md, README).
//   TS3_WEBQUERY_URL   ör. https://ts.ornek.com:10443 (http için 10080)
//   TS3_WEBQUERY_KEY   TS sunucusunda `apikeyadd scope=manage` ile üretilen anahtar
//   TS3_SANAL_SUNUCU   sanal sunucu numarası (varsayılan 1)
// İstek fetch ile değil node:http ile yapılır: fetch, WebQuery'nin varsayılan HTTP portu 10080'i "bad port" diye reddeder.
import http from "node:http";
import https from "node:https";

export interface TsAyari {
  url: string;
  anahtar: string;
  sunucu: number;
}

export type TsSonucu = { ok: true } | { ok: false; hata: string };

/** TeamSpeak mesajı en çok 1024 karakter */
export const TS_MESAJ_SINIRI = 1024;

export function tsAyari(env: Record<string, string | undefined> = process.env): TsAyari | null {
  const url = env.TS3_WEBQUERY_URL?.trim().replace(/\/+$/, "");
  const anahtar = env.TS3_WEBQUERY_KEY?.trim();
  if (!url || !anahtar) return null;
  const sunucu = Number(env.TS3_SANAL_SUNUCU ?? 1);
  return { url, anahtar, sunucu: Number.isInteger(sunucu) && sunucu > 0 ? sunucu : 1 };
}

/** TS'te kalın başlık + metin; uzunsa metin kısaltılır */
export function tsMesaji(klanAdi: string, baslik: string, govde: string): string {
  const bas = `[b]${klanAdi} · ${baslik.trim()}[/b]\n`;
  const metin = govde.trim();
  const yer = TS_MESAJ_SINIRI - bas.length;
  return bas + (metin.length > yer ? `${metin.slice(0, yer - 1).trimEnd()}…` : metin);
}

/** Panoya kopyalanacak düz metin (TS'e elle yapıştırmak için) */
export const kopyaMetni = (baslik: string, govde: string) => `${baslik.trim()}\n\n${govde.trim()}`;

interface WebQueryYaniti {
  status?: { code?: number; message?: string };
}

export interface HttpIstegi {
  headers: Record<string, string>;
  body: string;
  zamanAsimiMs: number;
}
/** POST atıp durum kodu ve gövdeyi döner; ağ hatasında fırlatır */
export type HttpIstemcisi = (url: string, istek: HttpIstegi) => Promise<{ status: number; govde: string }>;

export const nodeIstemcisi: HttpIstemcisi = (url, istek) => new Promise((coz, reddet) => {
  const u = new URL(url);
  const r = (u.protocol === "https:" ? https : http).request(u, {
    method: "POST",
    headers: { ...istek.headers, "content-length": Buffer.byteLength(istek.body) },
    timeout: istek.zamanAsimiMs,
  }, (y) => {
    let govde = "";
    y.setEncoding("utf8");
    y.on("data", (c: string) => { govde += c; });
    y.on("end", () => coz({ status: y.statusCode ?? 0, govde }));
    y.on("error", reddet);
  });
  r.on("timeout", () => r.destroy(new Error("zaman aşımı")));
  r.on("error", reddet);
  r.end(istek.body);
});

/** sendtextmessage targetmode=3: sanal sunucudaki herkese */
export async function tsGonder(ayar: TsAyari, mesaj: string, istemci: HttpIstemcisi = nodeIstemcisi): Promise<TsSonucu> {
  let yanit: { status: number; govde: string };
  try {
    yanit = await istemci(`${ayar.url}/${ayar.sunucu}/sendtextmessage`, {
      headers: { "x-api-key": ayar.anahtar, "content-type": "application/json" },
      body: JSON.stringify({ targetmode: 3, target: ayar.sunucu, msg: mesaj }),
      zamanAsimiMs: 5000,
    });
  } catch {
    return { ok: false, hata: "TeamSpeak sunucusuna ulaşılamadı. Duyuru panelde yayınlandı; metni kopyalayıp TS’e yapıştırabilirsin." };
  }
  let govde: WebQueryYaniti = {};
  try {
    govde = JSON.parse(yanit.govde) as WebQueryYaniti;
  } catch {
    // Gövde JSON değilse durum koduna bakılır
  }
  const basarili = yanit.status >= 200 && yanit.status < 300;
  if (basarili && govde.status?.code === 0) return { ok: true };
  if (yanit.status === 401 || yanit.status === 403 || /api ?key/i.test(govde.status?.message ?? "")) {
    return { ok: false, hata: "TeamSpeak WebQuery anahtarı geçersiz ya da yetkisi yok (TS3_WEBQUERY_KEY)." };
  }
  return { ok: false, hata: `TeamSpeak mesajı reddetti: ${govde.status?.message ?? `HTTP ${yanit.status}`}` };
}
