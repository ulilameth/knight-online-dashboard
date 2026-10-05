import type { Metadata } from "next";
import { Yakinda } from "@/components/kabuk/Yakinda";

export const metadata: Metadata = { title: "Karakter tasarımı" };

export default function Sayfa() {
  return <Yakinda ust="Build planlayıcı" baslik="Karakter tasarımı" oturum="Faz 1, oturum E" veri="lib/data/builds.ts" />;
}
