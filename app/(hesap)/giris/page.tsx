import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AksiyonFormu } from "@/components/hesap/AksiyonFormu";
import { Alan } from "@/components/ui/Alan";
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
        <Alan id="sifre" name="sifre" etiket="Şifre" type="password" autoComplete="current-password" required />
      </AksiyonFormu>
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/kayit" className="text-altin hover:text-altin-parlak">Davet kodun var mı? Kayıt ol</Link>
        <Link href="/sifre-sifirla" className="text-soluk hover:text-baslik">Şifremi unuttum</Link>
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
