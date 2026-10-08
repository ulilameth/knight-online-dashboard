"use server";
// Ayarlar: klan bilgisi ve açılış takvimi (yönetici), davet ve sıfırlama kodları (yetkili), yetki verme (yönetici).
import { revalidatePath } from "next/cache";
import { asamaFormunuCoz, klanFormunuCoz } from "@/lib/ayarlar";
import { veri, VeriHatasi } from "@/lib/data";
import type { Yetki } from "@/lib/types";

export type AyarSonucu = { hata?: string; tamam?: string; kod?: string } | null;

const metin = (f: FormData, ad: string) => String(f.get(ad) ?? "").trim();
const hataMetni = (e: unknown, varsayilan: string) => (e instanceof VeriHatasi ? e.message : varsayilan);
const YETKILER: readonly Yetki[] = ["uye", "yetkili", "yonetici"];

/** Klan adı, ırk ve açılış her sayfayı etkiler */
const herYeri = () => revalidatePath("/", "layout");

export async function klanAksiyonu(_: AyarSonucu, form: FormData): Promise<AyarSonucu> {
  const g = klanFormunuCoz({
    klanAdi: metin(form, "klanAdi"), monogram: metin(form, "monogram"), irk: metin(form, "irk"), sunucuAdi: metin(form, "sunucuAdi"),
    tsAdres: metin(form, "tsAdres"), acilisGun: metin(form, "acilisGun"), acilisSaat: metin(form, "acilisSaat"), levelSiniri: metin(form, "levelSiniri"),
  });
  if ("hata" in g) return { hata: g.hata };
  try {
    await (await veri()).ayarlar.ayarlarGuncelle(g);
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
  herYeri();
  return { tamam: "Klan bilgisi kaydedildi" };
}

export async function asamaAksiyonu(_: AyarSonucu, form: FormData): Promise<AyarSonucu> {
  const id = metin(form, "id");
  const g = asamaFormunuCoz({
    sira: metin(form, "sira"), baslik: metin(form, "baslik"), baslangicGun: metin(form, "baslangicGun"), saat: metin(form, "saat"),
    sonGun: metin(form, "sonGun"), aciklama: metin(form, "aciklama"), kaynakUrl: metin(form, "kaynakUrl"),
  }, id ? Number(id) : undefined);
  if ("hata" in g) return { hata: g.hata };
  try {
    await (await veri()).asamalar.asamaKaydet(g);
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
  herYeri();
  return { tamam: id ? "Aşama güncellendi" : "Aşama eklendi" };
}

export async function asamaSilAksiyonu(id: number): Promise<AyarSonucu> {
  try {
    await (await veri()).asamalar.asamaSil(id);
  } catch (e) {
    return { hata: hataMetni(e, "Silinemedi, tekrar dene") };
  }
  herYeri();
  return { tamam: "Aşama silindi" };
}

export async function davetOlusturAksiyonu(_: AyarSonucu, form: FormData): Promise<AyarSonucu> {
  const rutbe = metin(form, "rutbe");
  if (rutbe !== "uye" && rutbe !== "aday") return { hata: "Rütbeyi seç" };
  try {
    const kod = await (await veri()).davetler.kodOlustur({
      rutbe, gun: Number(metin(form, "gun") || 7), maxKullanim: Number(metin(form, "max") || 25), aciklama: metin(form, "aciklama") || null,
    });
    revalidatePath("/ayarlar");
    return { tamam: "Davet kodu oluşturuldu", kod };
  } catch (e) {
    return { hata: hataMetni(e, "Oluşturulamadı, tekrar dene") };
  }
}

export async function davetIptalAksiyonu(id: string): Promise<AyarSonucu> {
  try {
    await (await veri()).davetler.kodIptal(id);
  } catch (e) {
    return { hata: hataMetni(e, "İptal edilemedi, tekrar dene") };
  }
  revalidatePath("/ayarlar");
  return { tamam: "Kod iptal edildi; artık kayıt için kullanılamaz" };
}

export async function sifirlamaKoduAksiyonu(characterId: string): Promise<AyarSonucu> {
  try {
    const kod = await (await veri()).davetler.sifirlamaKoduOlustur(characterId);
    return { tamam: "Sıfırlama kodu oluşturuldu", kod };
  } catch (e) {
    return { hata: hataMetni(e, "Oluşturulamadı, tekrar dene") };
  }
}

export async function yetkiAksiyonu(profileId: string, yetki: Yetki): Promise<AyarSonucu> {
  if (!YETKILER.includes(yetki)) return { hata: "Yetki geçersiz" };
  try {
    await (await veri()).ayarlar.yetkiVer(profileId, yetki);
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
  herYeri();
  return { tamam: "Yetki güncellendi" };
}
