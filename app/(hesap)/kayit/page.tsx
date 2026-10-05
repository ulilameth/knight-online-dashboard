import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AksiyonFormu } from "@/components/hesap/AksiyonFormu";
import { Alan } from "@/components/ui/Alan";
import { davetAksiyonu } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { KayitAdimi } from "@/components/hesap/KayitAdimi";

export const metadata: Metadata = { title: "Kayıt" };

export default async function Kayit() {
  if (await getCurrentUser()) redirect("/");
  return (
    <>
      <KayitAdimi adim={1} baslik="Davet kodu" />
      <p className="mb-4 text-metin">Yetkililerden aldığın kodu yaz. Kod olmadan hesap açılmaz.</p>
      <AksiyonFormu aksiyon={davetAksiyonu} dugme="Devam et">
        <Alan id="kod" name="kod" etiket="Davet kodu" placeholder="L4BEL-XXXX-XXXX" autoComplete="off" autoCapitalize="characters" spellCheck={false} required />
      </AksiyonFormu>
      <p className="mt-5 text-sm"><Link href="/giris" className="text-altin hover:text-altin-parlak">Zaten üye misin? Giriş yap</Link></p>
    </>
  );
}
