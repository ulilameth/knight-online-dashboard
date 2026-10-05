import type { Metadata } from "next";
import { Yakinda } from "@/components/kabuk/Yakinda";

export const metadata: Metadata = { title: "Üyeler" };

export default function Sayfa() {
  return <Yakinda ust="Kadro" baslik="Üyeler" oturum="Faz 1, oturum A" veri="lib/data/members.ts" />;
}
