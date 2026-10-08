import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IkonSeti } from "@/components/ui/Ikon";
import { veri } from "@/lib/data";
// Yazı tipleri npm'den (@fontsource, OFL): derleme sırasında Google Fonts'a bağlanılmaz. Her ağırlık latin ve
// latin-ext (ğ, ş, ı, İ) alt kümeleriyle gelir; tarayıcı unicode-range'e göre yalnızca gerekeni indirir.
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const a = await (await veri()).ayarlar.ayarlar();
  return { title: { default: `${a.klanAdi} Klan Paneli`, template: `%s · ${a.klanAdi}` }, robots: { index: false } };
}

export default async function KokDuzen({ children }: { children: ReactNode }) {
  const a = await (await veri()).ayarlar.ayarlar();
  return (
    <html lang="tr" data-irk={a.irk === "el_morad" ? "el-morad" : "karus"}>
      <body>
        <IkonSeti />
        {children}
      </body>
    </html>
  );
}
