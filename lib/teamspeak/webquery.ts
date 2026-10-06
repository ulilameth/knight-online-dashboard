// TeamSpeak 3 WebQuery (sunucu 3.12+): duyuruyu sunucuya metin mesajı olarak gönderir.
// Yalnızca sunucuda çalışır; anahtar istemciye gitmez. Yapılandırılmamışsa arayüz "TeamSpeak'e de gönder" kutusunu gizler.
// Ortam: TS3_WEBQUERY_URL (ör. http://ts.ornek.com:10080), TS3_WEBQUERY_KEY (apikeyadd ile üretilir), TS3_SUNUCU_ID (varsayılan 1).

export interface TsAyari {
  adres: string;
  anahtar: string;
  sunucuId: number;
}

/** Ortam değişkenlerinden; eksikse null (özellik kapalı) */
export function tsAyari(ortam: Record<string, string | undefined> = process.env): TsAyari | null {
  const adres = ortam.TS3_WEBQUERY_URL?.trim().replace(/\/+$/, "");
  const anahtar = ortam.TS3_WEBQUERY_KEY?.trim();
  if (!adres || !anahtar) return null;
  const sunucuId = Number(ortam.TS3_SUNUCU_ID ?? 1);
  return { adres, anahtar, sunucuId: Number.isInteger(sunucuId) && sunucuId > 0 ? sunucuId : 1 };
}

export const tsYapilandirildi = () => tsAyari() !== null;

/** TeamSpeak metin mesajı sınırı (bayt) */
export const TS_MESAJ_SINIRI = 1024;

/** UTF-8'de sınırı aşmayacak şekilde kısaltır; kısaltılırsa "…" ekler */
export function baytaSigdir(metin: string, sinir = TS_MESAJ_SINIRI): string {
  const enc = new TextEncoder();
  if (enc.encode(metin).length <= sinir) return metin;
  const son = "…";
  let out = "";
  let boy = enc.encode(son).length;
  for (const c of metin) {
    const b = enc.encode(c).length;
    if (boy + b > sinir) break;
    out += c;
    boy += b;
  }
  return out + son;
}

/** Duyurunun TeamSpeak'te görünecek metni: klan adı ve başlık kalın, sonra gövde */
export function duyuruMetni(klanAdi: string, baslik: string, govde: string): string {
  // Kullanıcı metnindeki BBCode köşeli parantezleri biçimlendirmeyi bozmasın
  const temiz = (s: string) => s.replace(/\[(\/?)(b|i|u|url|color|size|img)\b/gi, "($1$2");
  return baytaSigdir(`[b][${temiz(klanAdi)}] ${temiz(baslik.trim())}[/b]\n${temiz(govde.trim())}`);
}

export class TsHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "TsHatasi";
  }
}

/**
 * Sunucudaki herkese metin mesajı (sendtextmessage targetmode=3). Başarısızsa kullanıcıya gösterilecek Türkçe TsHatasi.
 * fetch dışarıdan verilebilir (test).
 */
export async function tsSunucuyaGonder(metin: string, ayar: TsAyari | null = tsAyari(), f: typeof fetch = fetch): Promise<void> {
  if (!ayar) throw new TsHatasi("TeamSpeak bağlantısı ayarlanmamış");
  const url = new URL(`${ayar.adres}/${ayar.sunucuId}/sendtextmessage`);
  url.searchParams.set("targetmode", "3");
  url.searchParams.set("target", String(ayar.sunucuId));
  url.searchParams.set("msg", baytaSigdir(metin));
  let yanit: Response;
  try {
    yanit = await f(url, { headers: { "x-api-key": ayar.anahtar }, signal: AbortSignal.timeout(8000), cache: "no-store" });
  } catch {
    throw new TsHatasi("TeamSpeak sunucusuna ulaşılamadı; adres ve WebQuery portunu (10080) kontrol et");
  }
  if (yanit.status === 401 || yanit.status === 403) throw new TsHatasi("TeamSpeak WebQuery anahtarı geçersiz ya da yetkisiz");
  let govde: { status?: { code?: number; message?: string } } | null = null;
  try { govde = await yanit.json(); } catch { /* aşağıda */ }
  const kod = govde?.status?.code;
  if (!yanit.ok || kod === undefined) throw new TsHatasi(`TeamSpeak beklenmeyen yanıt verdi (HTTP ${yanit.status})`);
  if (kod === 0) return;
  if (kod === 2568) throw new TsHatasi("WebQuery anahtarının mesaj gönderme izni yok (apikeyadd scope=manage)");
  if (kod === 1024 || kod === 1033) throw new TsHatasi(`TeamSpeak sanal sunucu ${ayar.sunucuId} bulunamadı (TS3_SUNUCU_ID)`);
  throw new TsHatasi(`TeamSpeak mesajı reddetti: ${govde?.status?.message ?? kod}`);
}
