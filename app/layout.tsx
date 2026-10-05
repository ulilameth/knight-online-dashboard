import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Cinzel } from "next/font/google";
import type { ReactNode } from "react";
import { veri } from "@/lib/data";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin", "latin-ext"], weight: ["600", "700"], variable: "--font-cinzel" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--font-barlow-condensed" });
const barlow = Barlow({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-barlow" });

export async function generateMetadata(): Promise<Metadata> {
  const a = await (await veri()).ayarlar.ayarlar();
  return { title: { default: `${a.klanAdi} Klan Paneli`, template: `%s · ${a.klanAdi}` }, robots: { index: false } };
}

export default async function KokDuzen({ children }: { children: ReactNode }) {
  const a = await (await veri()).ayarlar.ayarlar();
  return (
    <html lang="tr" data-irk={a.irk === "el_morad" ? "el-morad" : "karus"} className={`${cinzel.variable} ${barlowCondensed.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
