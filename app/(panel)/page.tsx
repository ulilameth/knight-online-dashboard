import { SayfaBasligi } from "@/components/kabuk/Yakinda";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { HAZIRLIK_ADIMLARI } from "@/lib/data/prep";
import { acildiMi, gunMetni, goreliZaman, kalanSure, simdi, tamMetin } from "@/lib/time";

// Genel bakış: geri sayım, aşamalar ve klan hazırlığı (tam ekran Faz 1, oturum D)
export default async function GenelBakis() {
  const kullanici = await requireYetki("uye");
  const v = await veri();
  const [ayar, asamalar, karakterler, hazirliklar] = await Promise.all([
    v.ayarlar.ayarlar(), v.asamalar.asamalar(), v.uyeler.karakterler(), v.hazirlik.hazirliklar(),
  ]);
  const su = simdi();
  const kalan = kalanSure(ayar.acilisAt, su);
  const acik = acildiMi(ayar.acilisAt, su);
  const aktif = karakterler.filter((k) => k.durum === "aktif").length;
  const benim = hazirliklar.find((h) => h.profileId === kullanici.profil.id);
  const tamam = benim ? HAZIRLIK_ADIMLARI.slice(0, 4).filter((a) => benim[a]).length : 0;

  return (
    <>
      <SayfaBasligi ust="Genel bakış" baslik={acik ? "Sunucu açık" : "Açılışa hazırlık"} aciklama={`Sunucu açılışı: ${tamMetin(ayar.acilisAt)} (TSİ).`} />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel baslik="Açılışa kalan" className="md:col-span-2">
          {acik ? (
            <p className="text-metin">Sunucu {goreliZaman(ayar.acilisAt, su)} açıldı.</p>
          ) : (
            <div className="flex gap-6 font-display text-baslik" aria-label={`${kalan.gun} gün ${kalan.saat} saat ${kalan.dakika} dakika`}>
              {([["gün", kalan.gun], ["saat", kalan.saat], ["dakika", kalan.dakika]] as const).map(([ad, n]) => (
                <div key={ad} className="text-center">
                  <div className="text-5xl font-bold tabular-nums">{n}</div>
                  <div className="font-ui text-sm uppercase tracking-widest text-soluk">{ad}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel baslik="Klan">
          <p className="font-ui text-4xl font-bold text-altin">{aktif}</p>
          <p className="text-soluk">aktif üye · {karakterler.length} kayıtlı karakter</p>
          <p className="mt-3 text-metin">Hazırlığın: {tamam}/4 adım</p>
        </Panel>
        <Panel baslik="Aşamalar" className="md:col-span-3" sag={<Tag resmi>Resmi takvim</Tag>}>
          <ol className="grid gap-3 md:grid-cols-4">
            {asamalar.map((a) => (
              <li key={a.id} className="rounded-lg border border-cizgi-ince bg-kutu p-3">
                <div className="font-ui text-sm font-semibold text-altin">{a.sira}. aşama · {a.saatBelli ? tamMetin(a.baslangic) : gunMetni(a.baslangic)}</div>
                <div className="font-ui text-lg font-semibold text-baslik">{a.baslik}</div>
                {a.aciklama && <p className="text-sm text-soluk">{a.aciklama}</p>}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}
