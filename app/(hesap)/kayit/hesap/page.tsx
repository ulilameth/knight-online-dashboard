import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AksiyonFormu } from "@/components/hesap/AksiyonFormu";
import { SifreAlani } from "@/components/hesap/SifreAlani";
import { Alan } from "@/components/ui/Alan";
import { kayitAksiyonu } from "@/lib/actions/auth";
import { DAVET_CEREZI, davetCereziOku } from "@/lib/davet-cerezi";
import { kayitImzaAnahtari } from "@/lib/env";
import { SIFRE_EN_AZ } from "@/lib/giris";
import { KayitAdimi } from "@/components/hesap/KayitAdimi";

export const metadata: Metadata = { title: "Hesabını oluştur" };

export default async function Hesap() {
  if (!davetCereziOku((await cookies()).get(DAVET_CEREZI)?.value, kayitImzaAnahtari())) redirect("/kayit");
  return (
    <>
      <KayitAdimi adim={2} baslik="Hesabını oluştur" />
      <p className="mb-4 text-metin">Kodun doğrulandı. 15 dakika içinde hesabını aç.</p>
      <AksiyonFormu aksiyon={kayitAksiyonu} dugme="Hesabı oluştur">
        <Alan id="nick" name="nick" etiket="Nick" ipucu="Oyundaki karakter adın; giriş bununla yapılır." autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} required />
        <SifreAlani id="sifre" name="sifre" etiket="Şifre" ipucu={`En az ${SIFRE_EN_AZ} karakter.`} autoComplete="new-password" minLength={SIFRE_EN_AZ} required />
        <SifreAlani id="sifreTekrar" name="sifreTekrar" etiket="Şifre tekrar" autoComplete="new-password" required />
      </AksiyonFormu>
    </>
  );
}
