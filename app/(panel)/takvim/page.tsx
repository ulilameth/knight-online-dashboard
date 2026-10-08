import type { Metadata } from "next";
import { Yakinda } from "@/components/kabuk/Yakinda";

export const metadata: Metadata = { title: "Takvim ve duyurular" };

export default function Sayfa() {
  return <Yakinda ust="Takvim" baslik="Takvim ve duyurular" />;
}
