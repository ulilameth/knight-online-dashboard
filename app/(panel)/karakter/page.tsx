import type { Metadata } from "next";
import { Planlayici } from "@/components/karakter/Planlayici";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { Ikon } from "@/components/ui/Ikon";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { bosTaslak, buildtenTaslak, taslakDuzelt } from "@/lib/oyun/build";
import { gunMetni, saatMetni } from "@/lib/time";
import { yetkiYeterli } from "@/lib/types";

export const metadata: Metadata = { title: "Karakter tasarımı" };

export default async function KarakterTasarimi() {
  const kullanici = await requireYetki("uye");
  const v = await veri();
  const [ayar, irklar, agaclar, kurallar, dogrulanmamis, kayitli, sablonlar] = await Promise.all([
    v.ayarlar.ayarlar(), v.oyun.irklar(), v.oyun.agaclar(), v.oyun.kurallar(), v.oyun.dogrulanmamisKurallar(), v.buildler.benimBuildim(), v.buildler.sablonlar(),
  ]);
  const k = kullanici.karakter;
  const duzelt = (t: ReturnType<typeof bosTaslak>) => taslakDuzelt(t, irklar, ayar.irk);

  return (
    <>
      <SayfaBasligi ust="Build planlayıcı" baslik="Karakter tasarımı"
        aciklama="Stat ve skill puanlarını planla, eşyalarını ve takılarını tak, klanla paylaş. AP, savunma, can ve mana eşya bonuslarıyla birlikte kendiliğinden hesaplanır."
        sag={<a className="btn" href="https://kobugda.com/calculator/advanced" target="_blank" rel="noopener">KO Bugda’da hesapla <Ikon ad="i-out" /></a>} />
      <Planlayici
        profilId={kullanici.profil.id} nick={k?.ad ?? "Sen"} taraf={ayar.irk} irklar={irklar} agaclar={agaclar} kurallar={kurallar} dogrulanmamis={dogrulanmamis}
        yeni={duzelt(bosTaslak(k?.sinif ?? "warrior", k?.level ?? 1, k?.reb ?? 0))}
        kayitli={kayitli ? duzelt(buildtenTaslak(kayitli)) : null}
        kayitZamani={kayitli ? `${gunMetni(kayitli.updatedAt)} ${saatMetni(kayitli.updatedAt)}` : null}
        gorunur={k?.ekipmanGorunur ?? "klan"} yetkili={yetkiYeterli(kullanici.profil.yetki, "yetkili")}
        sablonlar={sablonlar.map((s) => ({ id: s.id, ad: s.ad, taslak: duzelt(buildtenTaslak(s)) }))}
      />
    </>
  );
}
