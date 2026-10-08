import type { Metadata } from "next";
import { Suspense } from "react";
import { EsyaKatalogu } from "@/components/esyalar/EsyaKatalogu";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { bosTaslak, buildtenTaslak, taslakDuzelt } from "@/lib/oyun/build";

export const metadata: Metadata = { title: "Eşyalar" };

export default async function Esyalar() {
  const kullanici = await requireYetki("uye");
  const v = await veri();
  const [ayar, irklar, kayitli] = await Promise.all([v.ayarlar.ayarlar(), v.oyun.irklar(), v.buildler.benimBuildim()]);
  const k = kullanici.karakter;
  const duzelt = (t: ReturnType<typeof bosTaslak>) => taslakDuzelt(t, irklar, ayar.irk);
  return (
    <>
      <SayfaBasligi ust="Katalog" baslik="Eşyalar"
        aciklama="Sınıfa göre eşyalar. Bir eşyaya tıkla: derece derece AP, savunma, gereken statlar ve bonuslar; tek tıkla build’e tak."
        sag={<span className="muted" style={{ fontSize: 13 }}>Kaynak: KO Bugda</span>} />
      <Suspense fallback={<div className="panel empty">Eşya kataloğu yükleniyor…</div>}>
        <EsyaKatalogu profilId={kullanici.profil.id} nick={k?.ad ?? "Sen"} taraf={ayar.irk} irklar={irklar}
          yeni={duzelt(bosTaslak(k?.sinif ?? "warrior", k?.level ?? 1, k?.reb ?? 0))}
          kayitli={kayitli ? duzelt(buildtenTaslak(kayitli)) : null} />
      </Suspense>
    </>
  );
}
