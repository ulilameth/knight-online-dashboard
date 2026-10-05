import Link from "next/link";
import type { ReactNode } from "react";
import { Arma } from "@/components/kabuk/Arma";
import { type Sekme, Sekmeler } from "@/components/kabuk/Sekmeler";
import { Button } from "@/components/ui/Button";
import { cikisAksiyonu } from "@/lib/actions/auth";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { IRK_ADI, RUTBE_ADI, RUTBE_RENGI } from "@/lib/etiketler";
import { yetkiYeterli } from "@/lib/types";

const SEKMELER: Sekme[] = [
  { href: "/", ad: "Genel bakış" },
  { href: "/uyeler", ad: "Üyeler" },
  { href: "/etkinlikler", ad: "Etkinlikler ve katılım" },
  { href: "/takvim", ad: "Takvim ve duyurular" },
  { href: "/karakter", ad: "Karakter tasarımı" },
  { href: "/esyalar", ad: "Eşyalar" },
  { href: "/profil", ad: "Profilim" },
];

export default async function PanelDuzeni({ children }: { children: ReactNode }) {
  const kullanici = await requireYetki("uye");
  const a = await (await veri()).ayarlar.ayarlar();
  const sekmeler = yetkiYeterli(kullanici.profil.yetki, "yetkili") ? [...SEKMELER, { href: "/ayarlar", ad: "Ayarlar" }] : SEKMELER;
  const k = kullanici.karakter;
  return (
    <div className="mx-auto max-w-6xl px-4">
      <header className="flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Arma monogram={a.monogram} />
          <span>
            <span className="block font-display text-2xl font-bold tracking-wide text-baslik">{a.klanAdi}</span>
            <span className="block font-ui text-xs uppercase tracking-[0.2em] text-soluk">{IRK_ADI[a.irk]} · Yeni sunucu 2026</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/profil" className="flex items-center gap-2 rounded-full border border-cizgi bg-kart py-1 pl-1 pr-3 hover:bg-kutu">
            <span className="grid size-8 place-items-center rounded-full bg-marka-sis font-ui text-sm font-bold text-baslik">{(k?.ad ?? "?").slice(0, 2).toLocaleUpperCase("tr")}</span>
            <span className="font-ui font-semibold text-baslik">{k?.ad ?? "Karakter yok"}</span>
            {k && <span className={`font-ui text-sm font-semibold ${RUTBE_RENGI[k.rutbe]}`}>{RUTBE_ADI[k.rutbe]}</span>}
          </Link>
          <form action={cikisAksiyonu}>
            <Button tur="ikincil" type="submit">Çıkış</Button>
          </form>
        </div>
      </header>
      <div className="border-b border-cizgi-ince">
        <Sekmeler sekmeler={sekmeler} />
      </div>
      <main className="py-6">{children}</main>
    </div>
  );
}
