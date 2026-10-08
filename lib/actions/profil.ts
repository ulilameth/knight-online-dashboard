"use server";
// Profilim: üyenin kendi karakteri ve şifresi.
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { authArkaUc } from "@/lib/auth-arka-uc";
import { veri, VeriHatasi } from "@/lib/data";
import { SINIFLAR } from "@/lib/etiketler";
import { sifreDegistir } from "@/lib/giris";
import type { Gorunurluk, Sinif } from "@/lib/types";

export type FormSonucu = { hata?: string; tamam?: string } | null;
const metin = (f: FormData, ad: string) => String(f.get(ad) ?? "").trim();

export async function profilAksiyonu(_: FormSonucu, form: FormData): Promise<FormSonucu> {
  const sinif = metin(form, "sinif") as Sinif;
  const gorunur = metin(form, "ekipmanGorunur") as Gorunurluk;
  if (!SINIFLAR.includes(sinif)) return { hata: "Sınıfını seç" };
  if (gorunur !== "klan" && gorunur !== "gizli") return { hata: "Ekipman görünürlüğünü seç" };
  const level = metin(form, "level"), reb = metin(form, "reb");
  try {
    await (await veri()).uyeler.profilGuncelle({
      sinif, tsNick: metin(form, "tsNick") || null, ekipmanGorunur: gorunur,
      ...(level !== "" && { level: Number(level) }),
      ...(reb !== "" && { reb: Number(reb) }),
    });
  } catch (e) {
    return { hata: e instanceof VeriHatasi ? e.message : "Kaydedilemedi, tekrar dene" };
  }
  revalidatePath("/profil");
  revalidatePath("/uyeler");
  revalidatePath("/");
  return { tamam: "Profilin kaydedildi. Üye listesinde görünüyor." };
}

export async function sifreAksiyonu(_: FormSonucu, form: FormData): Promise<FormSonucu> {
  const k = await getCurrentUser();
  if (!k?.karakter) return { hata: "Oturum bulunamadı; yeniden giriş yap" };
  const s = await sifreDegistir(await authArkaUc(), k.profil.id, {
    nick: k.karakter.ad, eski: String(form.get("eski") ?? ""), sifre: String(form.get("sifre") ?? ""), sifreTekrar: String(form.get("sifreTekrar") ?? ""),
  });
  return s.ok ? { tamam: "Şifren değişti" } : { hata: s.hata };
}
