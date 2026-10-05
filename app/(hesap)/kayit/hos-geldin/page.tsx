import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { veri } from "@/lib/data";
import { KayitAdimi } from "@/components/hesap/KayitAdimi";

export const metadata: Metadata = { title: "Hoş geldin" };

export default async function HosGeldin() {
  const k = await getCurrentUser();
  if (!k) redirect("/giris");
  const a = await (await veri()).ayarlar.ayarlar();
  return (
    <>
      <KayitAdimi adim={4} baslik={`Hoş geldin, ${k.karakter?.ad ?? ""}`} />
      <ul className="mb-6 flex list-disc flex-col gap-2 pl-5 text-metin">
        <li>TeamSpeak 3’te Bağlan › Sunucu adresi alanına <b className="text-baslik">{a.tsAdres}</b> yaz.</li>
        <li>Genel bakış’taki hazırlık listesinden telefon doğrulaması ve OTP’yi işaretle.</li>
        <li>Ön kayıt ve sunucu seçimi tarihleri panelde.</li>
      </ul>
      <LinkButton href="/" tur="birincil">Panele git</LinkButton>
    </>
  );
}
