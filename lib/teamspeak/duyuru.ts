// Duyuruyu TeamSpeak'e gönderir ve gönderildi zamanını kaydeder (Duyurular ekranının Server Action'ı bunu çağırır:
// duyuruyuTsyeGonder(await veri(), await getCurrentUser(), id)).
import type { Veri } from "@/lib/data";
import { VeriHatasi, YETKI_YOK } from "@/lib/data/ortak";
import { type Kullanici, yetkiYeterli } from "@/lib/types";
import { duyuruMetni, TsHatasi, tsSunucuyaGonder } from "./webquery";

export async function duyuruyuTsyeGonder(
  v: Pick<Veri, "duyurular" | "ayarlar">, kullanici: Kullanici | null, id: string, gonder = tsSunucuyaGonder,
): Promise<void> {
  // Mesaj geri alınamaz: yetki, gönderimden önce açıkça denetlenir (kayıt adımındaki RLS'e bırakılmaz)
  if (!kullanici || !yetkiYeterli(kullanici.profil.yetki, "yetkili")) throw new VeriHatasi(YETKI_YOK);
  const d = (await v.duyurular.duyurular()).find((x) => x.id === id);
  if (!d) throw new VeriHatasi("Duyuru bulunamadı");
  const { klanAdi } = await v.ayarlar.ayarlar();
  try {
    await gonder(duyuruMetni(klanAdi, d.baslik, d.govde));
  } catch (e) {
    if (e instanceof TsHatasi) throw new VeriHatasi(e.message);
    throw e;
  }
  await v.duyurular.tsGonderildi(id);
}
