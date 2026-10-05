import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AksiyonFormu } from "@/components/hesap/AksiyonFormu";
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
      <AksiyonFormu aksiyon={kayitAksiyonu} dugme="Hesabı oluştur">
        <Alan id="nick" name="nick" etiket="Nick" ipucu="Oyundaki karakter adın; giriş bununla yapılır." autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} required />
        <Alan id="sifre" name="sifre" etiket="Şifre" type="password" ipucu={`En az ${SIFRE_EN_AZ} karakter.`} autoComplete="new-password" minLength={SIFRE_EN_AZ} required />
        <Alan id="sifreTekrar" name="sifreTekrar" etiket="Şifre tekrar" type="password" autoComplete="new-password" required />
      </AksiyonFormu>
    </>
  );
}
