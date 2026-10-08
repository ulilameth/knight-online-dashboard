"use server";
// Takvim ve duyurular: haftalık düzen, haftanın etkinliklerini oluşturma, duyuru yazma ve TeamSpeak'e gönderme (yetkili).
import { revalidatePath } from "next/cache";
import { veri, VeriHatasi } from "@/lib/data";
import { tsAyari, tsGonder, tsMesaji } from "@/lib/teamspeak";
import { haftaninPazartesisi, simdi } from "@/lib/time";

export type IslemSonucu = { hata?: string; tamam?: string } | null;

/** Tarayıcı textarea satır sonlarını \r\n gönderir; \n yapılır */
const metin = (f: FormData, ad: string) => String(f.get(ad) ?? "").replace(/\r\n?/g, "\n").trim();
const hataMetni = (e: unknown, varsayilan: string) => (e instanceof VeriHatasi ? e.message : varsayilan);

function yenile() {
  revalidatePath("/takvim");
  revalidatePath("/etkinlikler");
  revalidatePath("/");
}

export async function duzenKaydetAksiyonu(_: IslemSonucu, form: FormData): Promise<IslemSonucu> {
  const id = metin(form, "id");
  const gun = Number(metin(form, "gun"));
  const sureDk = Number(metin(form, "sure"));
  try {
    const v = await veri();
    const tur = metin(form, "tur");
    if (!(await v.etkinlikler.turler()).some((t) => t.kod === tur)) return { hata: "Etkinlik türünü seç" };
    await v.etkinlikler.duzenKaydet({
      ...(id && { id }), tur, baslik: metin(form, "baslik"), gun, saat: metin(form, "saat"), sureDk, aktif: form.get("aktif") === "on",
    });
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
  yenile();
  return { tamam: id ? "Haftalık düzen güncellendi" : "Haftalık düzene eklendi" };
}

export async function duzenSilAksiyonu(id: string): Promise<IslemSonucu> {
  try {
    await (await veri()).etkinlikler.duzenSil(id);
  } catch (e) {
    return { hata: hataMetni(e, "Silinemedi, tekrar dene") };
  }
  yenile();
  return { tamam: "Haftalık düzenden çıkarıldı" };
}

/** Bu haftanın ya da gelecek haftanın etkinliklerini aktif düzenden oluşturur; olanlar tekrar oluşturulmaz */
export async function haftayiOlusturAksiyonu(hangi: "bu" | "gelecek"): Promise<IslemSonucu> {
  const pazartesi = haftaninPazartesisi(new Date(simdi().getTime() + (hangi === "gelecek" ? 7 * 86_400_000 : 0)));
  try {
    const yeni = await (await veri()).etkinlikler.haftayiOlustur(pazartesi);
    yenile();
    const hafta = hangi === "bu" ? "Bu hafta" : "Gelecek hafta";
    return yeni.length ? { tamam: `${hafta} için ${yeni.length} etkinlik oluşturuldu` } : { tamam: `${hafta}nın etkinlikleri zaten oluşturulmuş` };
  } catch (e) {
    return { hata: hataMetni(e, "Oluşturulamadı, tekrar dene") };
  }
}

async function tsyeGonder(id: string, baslik: string, govde: string): Promise<string | null> {
  const ayar = tsAyari();
  if (!ayar) return "TeamSpeak bağlantısı yapılandırılmamış";
  const v = await veri();
  const s = await tsGonder(ayar, tsMesaji((await v.ayarlar.ayarlar()).klanAdi, baslik, govde));
  if (!s.ok) return s.hata;
  await v.duyurular.tsGonderildi(id);
  return null;
}

export async function duyuruKaydetAksiyonu(_: IslemSonucu, form: FormData): Promise<IslemSonucu> {
  const id = metin(form, "id");
  const baslik = metin(form, "baslik"), govde = metin(form, "govde");
  if (!baslik || !govde) return { hata: "Başlık ve duyuru metni gerekli" };
  let kayitId: string;
  try {
    kayitId = (await (await veri()).duyurular.duyuruKaydet({ ...(id && { id }), baslik, govde, sabit: form.get("sabit") === "on" })).id;
  } catch (e) {
    return { hata: hataMetni(e, "Yayınlanamadı, tekrar dene") };
  }
  const tsHatasi = form.get("ts") === "on" ? await tsyeGonder(kayitId, baslik, govde) : null;
  yenile();
  const tamam = id ? "Duyuru güncellendi" : form.get("ts") === "on" && !tsHatasi ? "Duyuru yayınlandı ve TeamSpeak’e gönderildi" : "Duyuru yayınlandı";
  // Duyuru kaydedildi; TS hatası ayrıca gösterilir (form temizlenir)
  return tsHatasi ? { tamam, hata: tsHatasi } : { tamam };
}

export async function duyuruSilAksiyonu(id: string): Promise<IslemSonucu> {
  try {
    await (await veri()).duyurular.duyuruSil(id);
  } catch (e) {
    return { hata: hataMetni(e, "Silinemedi, tekrar dene") };
  }
  yenile();
  return { tamam: "Duyuru silindi" };
}

export async function duyuruSabitleAksiyonu(id: string, sabit: boolean): Promise<IslemSonucu> {
  try {
    const v = await veri();
    const d = (await v.duyurular.duyurular()).find((x) => x.id === id);
    if (!d) return { hata: "Duyuru bulunamadı" };
    await v.duyurular.duyuruKaydet({ id, baslik: d.baslik, govde: d.govde, sabit });
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
  yenile();
  return { tamam: sabit ? "Duyuru sabitlendi" : "Sabitleme kaldırıldı" };
}

export async function duyuruTsGonderAksiyonu(id: string): Promise<IslemSonucu> {
  try {
    const d = (await (await veri()).duyurular.duyurular()).find((x) => x.id === id);
    if (!d) return { hata: "Duyuru bulunamadı" };
    const hata = await tsyeGonder(id, d.baslik, d.govde);
    if (hata) return { hata };
  } catch (e) {
    return { hata: hataMetni(e, "Gönderilemedi, tekrar dene") };
  }
  yenile();
  return { tamam: "TeamSpeak’e gönderildi" };
}

