"use server";
// Üyeler: yetkilinin karakter ekleme ve düzenleme formu.
import { revalidatePath } from "next/cache";
import { veri, VeriHatasi } from "@/lib/data";
import { DURUMLAR, RUTBELER, SINIFLAR } from "@/lib/etiketler";
import type { KarakterDurum, Rutbe, Sinif } from "@/lib/types";

export type FormSonucu = { hata?: string; tamam?: string } | null;

const metin = (f: FormData, ad: string) => String(f.get(ad) ?? "").trim();
const sayiVeyaBos = (f: FormData, ad: string) => (metin(f, ad) === "" ? null : Number(metin(f, ad)));

export async function karakterKaydetAksiyonu(_: FormSonucu, form: FormData): Promise<FormSonucu> {
  const id = metin(form, "id");
  const sinif = metin(form, "sinif") as Sinif | "";
  const rutbe = metin(form, "rutbe") as Rutbe;
  const durum = metin(form, "durum") as KarakterDurum;
  if (sinif && !SINIFLAR.includes(sinif)) return { hata: "Sınıf geçersiz" };
  if (!RUTBELER.includes(rutbe)) return { hata: "Rütbe geçersiz" };
  if (!DURUMLAR.includes(durum)) return { hata: "Durum geçersiz" };
  const level = sayiVeyaBos(form, "level");
  const reb = sayiVeyaBos(form, "reb") ?? 0;
  if (level !== null && Number.isNaN(level)) return { hata: "Level sayı olmalı" };
  const g = { ad: metin(form, "ad"), sinif: sinif || null, level, reb: level === 83 ? reb : 0, rutbe, durum, notlar: metin(form, "notlar") || null };
  try {
    const v = await veri();
    if (id) await v.uyeler.karakterGuncelle(id, g);
    else await v.uyeler.karakterEkle(g);
  } catch (e) {
    return { hata: e instanceof VeriHatasi ? e.message : "Kaydedilemedi, tekrar dene" };
  }
  revalidatePath("/uyeler");
  revalidatePath("/");
  return { tamam: id ? `${g.ad} güncellendi` : `${g.ad} eklendi` };
}
