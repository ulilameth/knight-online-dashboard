"use server";
// Genel bakış: üyenin kendi hazırlık adımları.
import { revalidatePath } from "next/cache";
import { veri, VeriHatasi } from "@/lib/data";
import { HAZIRLIK_ADIMLARI, type HazirlikAdimi } from "@/lib/data/prep";

export async function hazirlikAksiyonu(adim: HazirlikAdimi, deger: boolean): Promise<{ hata?: string }> {
  if (!HAZIRLIK_ADIMLARI.includes(adim)) return { hata: "Bilinmeyen adım" };
  try {
    await (await veri()).hazirlik.isaretle(adim, deger);
  } catch (e) {
    return { hata: e instanceof VeriHatasi ? e.message : "Kaydedilemedi, tekrar dene" };
  }
  revalidatePath("/");
  revalidatePath("/uyeler");
  return {};
}
