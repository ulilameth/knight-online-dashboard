// Kayıt adım 1'de doğrulanan kodu adım 2'ye taşıyan imzalı çerez (httpOnly, 15 dakika).
// Biçim: base64url(JSON {kod, son}) + "." + base64url(HMAC-SHA256)
import { createHmac, timingSafeEqual } from "node:crypto";

export const DAVET_CEREZI = "l4bel_davet";
export const DAVET_SURESI_SN = 15 * 60;

const imza = (veri: string, anahtar: string) => createHmac("sha256", anahtar).update(veri).digest("base64url");

export function davetCereziYaz(kod: string, anahtar: string, simdi = Date.now()): string {
  const veri = Buffer.from(JSON.stringify({ kod, son: simdi + DAVET_SURESI_SN * 1000 })).toString("base64url");
  return `${veri}.${imza(veri, anahtar)}`;
}

/** İmza doğru ve süresi dolmamışsa kodu, değilse null döner */
export function davetCereziOku(deger: string | undefined, anahtar: string, simdi = Date.now()): string | null {
  if (!deger) return null;
  const [veri, gelen] = deger.split(".");
  if (!veri || !gelen) return null;
  const beklenen = Buffer.from(imza(veri, anahtar));
  const verilen = Buffer.from(gelen);
  if (beklenen.length !== verilen.length || !timingSafeEqual(beklenen, verilen)) return null;
  try {
    const { kod, son } = JSON.parse(Buffer.from(veri, "base64url").toString("utf8"));
    return typeof kod === "string" && typeof son === "number" && son > simdi ? kod : null;
  } catch {
    return null;
  }
}
