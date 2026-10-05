import type { Metadata } from "next";
import { Yakinda } from "@/components/kabuk/Yakinda";
import { requireYetki } from "@/lib/auth";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function Sayfa() {
  await requireYetki("yetkili");
  return <Yakinda ust="Yönetim" baslik="Ayarlar" oturum="Faz 1, oturum D" veri="lib/data/settings.ts, invites.ts, milestones.ts" />;
}
