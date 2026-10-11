import type { Metadata } from "next";
import { GorevRehberi } from "@/components/gorevler/GorevRehberi";
import { Bonuslar, Etkinlikler, GorevPayi, GunlukDuzen, Kaynaklar, SinifNotlari } from "@/components/gorevler/RehberPanelleri";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { barYuzdesi } from "@/lib/gorevler/exp";
import { expMetni } from "@/lib/gorevler/hesap";
import { GOREVLER } from "@/lib/gorevler/veri";
import { acildiMi } from "@/lib/time";

export const metadata: Metadata = { title: "Görevler" };

const SAKLANAN = GOREVLER.filter((g) => g.oneri === "sakla");
const SAKLANAN_EXP = SAKLANAN.reduce((t, g) => t + (g.exp ?? 0), 0);

export default async function Gorevler() {
  const kullanici = await requireYetki("uye");
  const ayar = await (await veri()).ayarlar.ayarlar();
  const k = kullanici.karakter;
  // Açılıştan önce herkes yeni sunucuda 1. levelden başlayacak; kayıtlı level eski sunucudan
  const acik = acildiMi(ayar.acilisAt);
  return (
    <>
      <SayfaBasligi ust="Level rehberi" baslik="Görevler"
        aciklama={`${ayar.levelSiniri}’e en hızlı yol: hangi görevi ne zaman yapmalı, hangisini ertelemeli ya da atlamalı, görevler bitince nerede kasılır. Görev, NPC ve mob adları oyundaki İngilizce halleriyle.`} />
      {ayar.levelSiniri === 80 && (
        <p className="callout gq-sinir" role="note">
          <b>Sınır şimdilik 80, 83 sonra açılacak.</b> {SAKLANAN.map((g) => g.ad.replace(/ \(1\) \/ .*$/, "")).join(", ")} görevlerini (toplam ~{expMetni(SAKLANAN_EXP)} EXP)
          83 açılana kadar teslim etme: sınırdayken verilen EXP’nin saklandığını gösteren bir kaynak yok. 83 açılınca bu görevler 80 barının ~%{Math.round(barYuzdesi(SAKLANAN_EXP, 80))}’ini tek seferde verir.
        </p>
      )}
      <div className="stack">
        <GorevRehberi profilId={kullanici.profil.id} taraf={ayar.irk} levelSiniri={ayar.levelSiniri} level={acik ? k?.level ?? 1 : 1} acik={acik} />
        <div className="grid">
          <div className="s7 stack"><GorevPayi /><Etkinlikler /></div>
          <div className="s5 stack"><GunlukDuzen /><Bonuslar /></div>
        </div>
        <SinifNotlari sinif={k?.sinif ?? null} taraf={ayar.irk} />
        <Kaynaklar />
      </div>
    </>
  );
}
