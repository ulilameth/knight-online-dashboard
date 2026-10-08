"use server";
// Karakter tasarımı: üyenin build'ini kaydetme ve yetkili şablonları. Taslak istemciden gelir; kurallara ve kataloğa
// göre sunucuda yeniden doğrulanır.
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { veri, VeriHatasi } from "@/lib/data";
import { irkBul } from "@/lib/data/oyun";
import { SINIFLAR } from "@/lib/etiketler";
import { type Taslak, buildtenTaslak, taslakDogrula, taslaktanBuild } from "@/lib/oyun/build";
import { katalog } from "@/lib/oyun/katalog-sunucu";
import { yetkiYeterli } from "@/lib/types";

export type KarakterSonucu = { hata?: string; tamam?: string };

const hataMetni = (e: unknown, varsayilan: string) => (e instanceof VeriHatasi ? e.message : varsayilan);

/** İstemciden gelen nesneyi taslağa çevirip doğrular */
async function hazirla(g: Taslak): Promise<{ t: Taslak } | { hata: string }> {
  if (!g || typeof g !== "object" || !SINIFLAR.includes(g.sinif)) return { hata: "Sınıf geçersiz" };
  const v = await veri();
  const [ayar, irklar, agaclar, kurallar] = await Promise.all([v.ayarlar.ayarlar(), v.oyun.irklar(), v.oyun.agaclar(), v.oyun.kurallar()]);
  const t = buildtenTaslak({ ...g, apGirdileri: { ...(g.ekler ?? {}) } });
  const irk = irkBul(irklar, t.sinif, ayar.irk, t.irkTuru);
  t.irkTuru = irk.irkTuru;
  const hata = taslakDogrula(t, irk, katalog(), kurallar, agaclar[t.sinif]);
  return hata ? { hata } : { t };
}

function yenile() {
  revalidatePath("/karakter");
  revalidatePath("/uyeler", "layout");
  revalidatePath("/");
}

export async function buildKaydetAksiyonu(g: Taslak): Promise<KarakterSonucu> {
  const k = await getCurrentUser();
  if (!k?.karakter) return { hata: "Hesabına bağlı karakter yok" };
  const h = await hazirla(g);
  if ("hata" in h) return h;
  try {
    await (await veri()).buildler.buildKaydet(taslaktanBuild(h.t, k.karakter.ad));
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
  yenile();
  const lv = h.t.level === 83 && h.t.reb ? `83+${h.t.reb}` : String(h.t.level);
  return {
    tamam: `Build kaydedildi, level ${lv}. ${k.karakter.ekipmanGorunur === "gizli" ? "Ekipmanın gizli; yalnızca sen görürsün." : "Üye listesinde klan görebilir."}`,
  };
}

export async function sablonKaydetAksiyonu(g: Taslak, ad: string): Promise<KarakterSonucu> {
  const k = await getCurrentUser();
  if (!k || !yetkiYeterli(k.profil.yetki, "yetkili")) return { hata: "Şablonu yalnızca yetkililer ekler" };
  const temiz = String(ad ?? "").trim();
  if (!temiz || temiz.length > 40) return { hata: "Şablon adı 1-40 karakter olmalı" };
  const h = await hazirla(g);
  if ("hata" in h) return h;
  try {
    await (await veri()).buildler.sablonKaydet(taslaktanBuild(h.t, temiz));
  } catch (e) {
    return { hata: hataMetni(e, "Kaydedilemedi, tekrar dene") };
  }
  revalidatePath("/karakter");
  return { tamam: `“${temiz}” klan şablonlarına eklendi` };
}

export async function sablonSilAksiyonu(id: string): Promise<KarakterSonucu> {
  try {
    await (await veri()).buildler.sablonSil(id);
  } catch (e) {
    return { hata: hataMetni(e, "Silinemedi, tekrar dene") };
  }
  revalidatePath("/karakter");
  return { tamam: "Şablon silindi" };
}
