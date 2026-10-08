"use server";
// Etkinlikler: yetkilinin etkinlik oluşturma, düzenleme, silme ve yoklama işaretlemesi.
import { revalidatePath } from "next/cache";
import { veri, VeriHatasi } from "@/lib/data";
import { YOKLAMA_DURUMLARI } from "@/lib/etiketler";
import { etkinlikFormunuCoz, yoklamaAcik } from "@/lib/etkinlik";
import { simdi } from "@/lib/time";
import type { YoklamaDurumu } from "@/lib/types";

export type EtkinlikSonucu = { hata?: string; tamam?: string; id?: string } | null;

const metin = (f: FormData, ad: string) => String(f.get(ad) ?? "");
const hataMetni = (e: unknown, varsayilan: string) => (e instanceof VeriHatasi ? e.message : varsayilan);

function yenile() {
  revalidatePath("/etkinlikler");
  revalidatePath("/takvim");
  revalidatePath("/uyeler", "layout");
  revalidatePath("/");
}

export async function etkinlikKaydetAksiyonu(_: EtkinlikSonucu, form: FormData): Promise<EtkinlikSonucu> {
  const id = metin(form, "id");
  try {
    const v = await veri();
    const g = etkinlikFormunuCoz({
      tur: metin(form, "tur"), baslik: metin(form, "baslik"), tarih: metin(form, "tarih"),
      saat: metin(form, "saat"), sure: metin(form, "sure"), aciklama: metin(form, "aciklama"),
    }, await v.etkinlikler.turler());
    if ("hata" in g) return { hata: g.hata };
    const e = await v.etkinlikler.etkinlikKaydet({ ...g, ...(id && { id }) });
    yenile();
    return { tamam: id ? "Etkinlik güncellendi" : "Etkinlik oluşturuldu", id: e.id };
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
}

export async function etkinlikSilAksiyonu(id: string): Promise<{ hata?: string }> {
  try {
    await (await veri()).etkinlikler.etkinlikSil(id);
  } catch (e) {
    return { hata: hataMetni(e, "Silinemedi, tekrar dene") };
  }
  yenile();
  return {};
}

/** durum null ise işaret kaldırılır */
export async function yoklamaAksiyonu(eventId: string, characterIds: string[], durum: YoklamaDurumu | null): Promise<{ hata?: string }> {
  if (durum !== null && !YOKLAMA_DURUMLARI.includes(durum)) return { hata: "Geçersiz durum" };
  if (!Array.isArray(characterIds) || characterIds.some((c) => typeof c !== "string")) return { hata: "Geçersiz istek" };
  try {
    const v = await veri();
    const e = await v.etkinlikler.etkinlik(eventId);
    if (!e) return { hata: "Etkinlik bulunamadı" };
    if (!yoklamaAcik(e, simdi())) return { hata: "Yoklama etkinlik saatinde açılır" };
    await v.yoklamalar.isaretle(eventId, characterIds, durum);
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
  yenile();
  return {};
}
