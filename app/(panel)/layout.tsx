import Link from "next/link";
import type { ReactNode } from "react";
import { Arma } from "@/components/kabuk/Arma";
import { type Sekme, Sekmeler } from "@/components/kabuk/Sekmeler";
import { ToastSaglayici } from "@/components/ui/Toast";
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
    <ToastSaglayici>
      <div className="wrap">
        <header className="top">
          <Link href="/" className="brand" style={{ textDecoration: "none" }}>
            <Arma monogram={a.monogram} />
            <div>
              <div className="brand-name">{a.klanAdi}</div>
              <div className="brand-sub">{IRK_ADI[a.irk]} · Yeni sunucu 2026</div>
            </div>
          </Link>
          <div className="controls">
            <Link href="/profil" className="me" aria-label="Profilim" style={{ textDecoration: "none" }}>
              <span className="avatar">{(k?.ad ?? "?").slice(0, 2).toLocaleUpperCase("tr")}</span>
              <span><b>{k?.ad ?? "Karakter yok"}</b> {k && <span style={{ color: RUTBE_RENGI[k.rutbe] }}>{RUTBE_ADI[k.rutbe]}</span>}</span>
            </Link>
            <form action={cikisAksiyonu}>
              <button type="submit" className="btn">Çıkış</button>
            </form>
          </div>
        </header>
        <Sekmeler sekmeler={sekmeler} />
        <main className="sayfa">{children}</main>
      </div>
    </ToastSaglayici>
  );
}
