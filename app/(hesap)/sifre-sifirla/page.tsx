import type { Metadata } from "next";
import Link from "next/link";
import { AksiyonFormu } from "@/components/hesap/AksiyonFormu";
import { Alan } from "@/components/ui/Alan";
import { sifirlaAksiyonu } from "@/lib/actions/auth";
import { SIFRE_EN_AZ } from "@/lib/giris";

export const metadata: Metadata = { title: "Şifre sıfırlama" };

export default function SifreSifirla() {
  return (
    <>
      <h1 className="mb-2 font-ui text-2xl font-semibold text-baslik">Şifre sıfırlama</h1>
      <p className="mb-4 text-metin">Bir yetkiliden sıfırlama kodu iste; kod 24 saat geçerli ve tek kullanımlık.</p>
      <AksiyonFormu aksiyon={sifirlaAksiyonu} dugme="Şifreyi değiştir">
        <Alan id="nick" name="nick" etiket="Nick" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
        <Alan id="kod" name="kod" etiket="Sıfırlama kodu" placeholder="XXXX-XXXX" autoComplete="off" autoCapitalize="characters" required />
        <Alan id="sifre" name="sifre" etiket="Yeni şifre" type="password" ipucu={`En az ${SIFRE_EN_AZ} karakter.`} autoComplete="new-password" required />
        <Alan id="sifreTekrar" name="sifreTekrar" etiket="Yeni şifre tekrar" type="password" autoComplete="new-password" required />
      </AksiyonFormu>
      <p className="mt-5 text-sm"><Link href="/giris" className="text-altin hover:text-altin-parlak">Girişe dön</Link></p>
    </>
  );
}
