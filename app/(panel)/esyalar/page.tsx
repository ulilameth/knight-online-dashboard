import type { Metadata } from "next";
import { Yakinda } from "@/components/kabuk/Yakinda";

export const metadata: Metadata = { title: "Eşyalar" };

export default function Sayfa() {
  return <Yakinda ust="Katalog" baslik="Eşyalar" oturum="Faz 1, oturum E" veri="design/katalog.json" />;
}
