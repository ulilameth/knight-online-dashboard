import type { Metadata } from "next";
import { type DuyuruSatiri, Duyurular } from "@/components/duyurular/Duyurular";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { AyTakvimi } from "@/components/takvim/AyTakvimi";
import { HaftalikDuzen } from "@/components/takvim/HaftalikDuzen";
import { Panel } from "@/components/ui/Panel";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { ayCoz, ayIzgarasi, takvimOgeleri } from "@/lib/takvim";
import { kopyaMetni, tsAyari } from "@/lib/teamspeak";
import { acildiMi, simdi, tsi, tsiGunu } from "@/lib/time";
import { yetkiYeterli } from "@/lib/types";

export const metadata: Metadata = { title: "Takvim ve duyurular" };

export default async function Takvim({ searchParams }: { searchParams: Promise<{ ay?: string }> }) {
  const kullanici = await requireYetki("uye");
  const su = simdi();
  const ay = ayCoz((await searchParams).ay, su);
  const gunler = ayIzgarasi(ay);
  const v = await veri();
  const [ayar, asamalar, etkinlikler, turler, duzen, duyurular, karakterler] = await Promise.all([
    v.ayarlar.ayarlar(), v.asamalar.asamalar(),
    v.etkinlikler.etkinlikler({ baslangic: tsi(gunler[0]), bitis: new Date(Date.parse(tsi(gunler.at(-1)!)) + 86_400_000).toISOString() }),
    v.etkinlikler.turler(), v.etkinlikler.duzen(), v.duyurular.duyurular(), v.uyeler.karakterler(),
  ]);
  const yetkili = yetkiYeterli(kullanici.profil.yetki, "yetkili");
  const acik = acildiMi(ayar.acilisAt, su);
  const duzenGorunur = acik || yetkili;
  const yazar = (profilId: string | null) => karakterler.find((k) => k.profileId === profilId && k.anaKarakter)?.ad ?? "Yetkili";
  const satirlar: DuyuruSatiri[] = duyurular.map((d) => ({ duyuru: d, yazar: yazar(d.yazar), kopya: kopyaMetni(d.baslik, d.govde) }));

  return (
    <>
      <SayfaBasligi ust="Plan" baslik="Takvim ve duyurular"
        aciklama={`Resmi tarihler altın renkte. Duyurular istenirse TeamSpeak sunucusuna (${ayar.tsAdres}) mesaj olarak da gönderilir.`} />
      <div className="grid">
        <Panel className="s12">
          <AyTakvimi ay={ay} ogeler={takvimOgeleri(etkinlikler, asamalar, turler)} bugun={tsiGunu(su)} />
        </Panel>
        {duzenGorunur && (
          <Panel className="s5" baslik="Haftalık düzen" alt={acik ? "Saatler TSİ" : "Açılıştan sonra uygulanır"}>
            <HaftalikDuzen duzen={duzen} turler={turler} yetkili={yetkili} acik={acik} />
          </Panel>
        )}
        <Panel className={duzenGorunur ? "s7" : "s12"} baslik="Duyurular" alt="Sabitlenenler üstte">
          <Duyurular satirlar={satirlar} yetkili={yetkili} tsAcik={!!tsAyari()} />
        </Panel>
      </div>
    </>
  );
}
