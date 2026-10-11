import type { Metadata } from "next";
import { RehberSekmeleri } from "@/components/gorevler/RehberSekmeleri";
import { Bonuslar, Etkinlikler, GunlukDuzen, Kaynaklar, SinifNotlari } from "@/components/gorevler/RehberPanelleri";
import { Rota } from "@/components/gorevler/Rota";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { acildiMi } from "@/lib/time";

export const metadata: Metadata = { title: "Görevler" };

export default async function Gorevler() {
  const kullanici = await requireYetki("uye");
  const ayar = await (await veri()).ayarlar.ayarlar();
  const k = kullanici.karakter;
  // Açılıştan önce herkes yeni sunucuda 1. levelden başlayacak; kayıtlı level eski sunucudan
  const acik = acildiMi(ayar.acilisAt);
  return (
    <>
      <SayfaBasligi ust="Level rehberi" baslik="Görevler"
        aciklama={`1’den ${ayar.levelSiniri}’e durak durak: her aralıkta önce hangi görevler, neyi sonraya bırakmalı, görevler bitince nerede kasılır. Görev, NPC ve mob adları oyundaki İngilizce halleriyle.`} />
      <div className="stack">
        <Rota profilId={kullanici.profil.id} taraf={ayar.irk} levelSiniri={ayar.levelSiniri} level={acik ? k?.level ?? 1 : 1} acik={acik} />
        <RehberSekmeleri sekmeler={[
          { id: "gunluk", ad: "Günlük düzen", icerik: <GunlukDuzen /> },
          { id: "etkinlik", ad: "Etkinlikler", icerik: <Etkinlikler /> },
          { id: "bonus", ad: "EXP bonusları", icerik: <Bonuslar /> },
          { id: "sinif", ad: "Sınıflar", icerik: <SinifNotlari sinif={k?.sinif ?? null} taraf={ayar.irk} /> },
          { id: "kaynak", ad: "Kaynaklar", icerik: <Kaynaklar /> },
        ]} />
      </div>
    </>
  );
}
