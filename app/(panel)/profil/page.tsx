import type { Metadata } from "next";
import { Yakinda } from "@/components/kabuk/Yakinda";

export const metadata: Metadata = { title: "Profilim" };

export default function Sayfa() {
  return <Yakinda ust="Hesabım" baslik="Profilim" oturum="Faz 1, oturum A" veri="lib/data/members.ts (profilGuncelle)" />;
}
