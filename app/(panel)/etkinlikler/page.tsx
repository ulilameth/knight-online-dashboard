import type { Metadata } from "next";
import { Yakinda } from "@/components/kabuk/Yakinda";

export const metadata: Metadata = { title: "Etkinlikler ve katılım" };

export default function Sayfa() {
  return <Yakinda ust="Etkinlikler" baslik="Etkinlikler ve katılım" oturum="Faz 1, oturum B" veri="lib/data/events.ts, attendance.ts" />;
}
