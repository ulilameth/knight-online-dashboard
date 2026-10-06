import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AksiyonFormu } from "@/components/hesap/AksiyonFormu";
import { SifreAlani } from "@/components/hesap/SifreAlani";
import { Alan } from "@/components/ui/Alan";
import { LinkButton } from "@/components/ui/Button";
import { girisAksiyonu } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_DAVET_KODU, DEMO_SIFRE } from "@/lib/demo/fixtures";
import { veriKaynagi } from "@/lib/env";

export const metadata: Metadata = { title: "Giriş" };

export default async function Giris() {
  if (await getCurrentUser()) redirect("/");
  return (
    <>
      <h1 className="mb-4 font-ui text-2xl font-semibold text-baslik">Giriş yap</h1>
      <AksiyonFormu aksiyon={girisAksiyonu} dugme="Giriş yap">
        <Alan id="nick" name="nick" etiket="Nick" autoComplete="username" required autoCapitalize="none" spellCheck={false} />
        <SifreAlani id="sifre" name="sifre" etiket="Şifre" autoComplete="current-password" required />
      </AksiyonFormu>
      <p className="mt-4 text-right text-sm">
        <Link href="/sifre-sifirla" className="text-soluk hover:text-baslik">Şifremi unuttum</Link>
      </p>
      <div className="mt-5 flex flex-col gap-2 border-t border-cizgi-ince pt-5">
        <p className="text-sm text-metin">Klana yeni mi katılıyorsun? Yetkililerden aldığın davet koduyla hesap aç.</p>
        <LinkButton href="/kayit">Davet koduyla kayıt ol</LinkButton>
      </div>
      {veriKaynagi() === "demo" && (
        <p className="mt-5 rounded-lg bg-altin-sis p-3 text-sm text-metin">
          Demo modu: <b>KaraBey</b> (yönetici), <b>DemirYumruk</b> (yetkili), <b>GeceKuşu</b> (üye); şifre <code>{DEMO_SIFRE}</code>.
          Kayıt için davet kodu <code>{DEMO_DAVET_KODU}</code>.
        </p>
      )}
    </>
  );
}
