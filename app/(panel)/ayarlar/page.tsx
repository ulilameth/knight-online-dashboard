import type { Metadata } from "next";
import { Yakinda } from "@/components/kabuk/Yakinda";
import { requireYetki } from "@/lib/auth";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function Sayfa() {
  await requireYetki("yetkili");
  return <Yakinda ust="Yönetim" baslik="Ayarlar" />;
}
