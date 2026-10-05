"use server";
// Giriş, kayıt (3 adım), şifre sıfırlama ve çıkış formlarının Server Action'ları (useActionState ile kullanılır).
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authArkaUc, oturumuKapat } from "@/lib/auth-arka-uc";
import { veri, VeriHatasi } from "@/lib/data";
import { DAVET_CEREZI, DAVET_SURESI_SN, davetCereziOku, davetCereziYaz } from "@/lib/davet-cerezi";
import { kayitImzaAnahtari } from "@/lib/env";
import { HATA, davetKoduKontrol, girisYap, kayitOlustur, sifreSifirla } from "@/lib/giris";
import type { Sinif } from "@/lib/types";

export type FormDurumu = { hata?: string; tamam?: string } | null;

const alan = (f: FormData, ad: string) => String(f.get(ad) ?? "");
const SINIFLAR: readonly Sinif[] = ["warrior", "rogue", "mage", "priest", "kurian"];

async function istemciIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "bilinmiyor";
}

export async function girisAksiyonu(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const s = await girisYap(await authArkaUc(), alan(form, "nick"), alan(form, "sifre"));
  if (!s.ok) return { hata: s.hata };
  redirect("/");
}

/** Kayıt adım 1: kod doğruysa 15 dakikalık imzalı çerez, sonra hesap adımı */
export async function davetAksiyonu(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const s = await davetKoduKontrol(await authArkaUc(), alan(form, "kod"), await istemciIp());
  if (!s.ok) return { hata: s.hata };
  (await cookies()).set(DAVET_CEREZI, davetCereziYaz(s.deger, kayitImzaAnahtari()), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: DAVET_SURESI_SN, path: "/",
  });
  redirect("/kayit/hesap");
}

/** Kayıt adım 2: nick + şifre; hesap açılır ve oturum başlar */
export async function kayitAksiyonu(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const cerezler = await cookies();
  const kod = davetCereziOku(cerezler.get(DAVET_CEREZI)?.value, kayitImzaAnahtari());
  if (!kod) return { hata: "Kayıt süresi doldu; davet kodunu yeniden gir" };
  const s = await kayitOlustur(await authArkaUc(), {
    kod, nick: alan(form, "nick"), sifre: alan(form, "sifre"), sifreTekrar: alan(form, "sifreTekrar"),
  });
  if (!s.ok) return { hata: s.hata };
  cerezler.delete(DAVET_CEREZI);
  redirect("/kayit/karakter");
}

/** Kayıt adım 3: sınıf ve TeamSpeak nick'i (level açılıştan sonra Profilim'den) */
export async function karakterAksiyonu(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const sinif = alan(form, "sinif") as Sinif;
  if (!SINIFLAR.includes(sinif)) return { hata: "Sınıfını seç" };
  try {
    await (await veri()).uyeler.profilGuncelle({ sinif, tsNick: alan(form, "tsNick") || null });
  } catch (e) {
    return { hata: e instanceof VeriHatasi ? e.message : HATA.genel };
  }
  redirect("/kayit/hos-geldin");
}

export async function sifirlaAksiyonu(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const s = await sifreSifirla(await authArkaUc(), {
    nick: alan(form, "nick"), kod: alan(form, "kod"), sifre: alan(form, "sifre"), sifreTekrar: alan(form, "sifreTekrar"),
  }, await istemciIp());
  return s.ok ? { tamam: "Şifren değişti. Yeni şifrenle giriş yapabilirsin." } : { hata: s.hata };
}

export async function cikisAksiyonu() {
  await oturumuKapat();
  redirect("/giris");
}
