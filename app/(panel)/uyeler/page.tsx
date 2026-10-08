import type { Metadata } from "next";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { SinifDagilimi } from "@/components/ortak/SinifDagilimi";
import { Panel } from "@/components/ui/Panel";
import { type UyeSatiri, UyeTablosu } from "@/components/uyeler/UyeTablosu";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { irkBul } from "@/lib/data/oyun";
import { RUTBE_ADI, RUTBE_RENGI, RUTBELER } from "@/lib/etiketler";
import { HAZIRLIK, acilisAni } from "@/lib/hazirlik";
import { gecmisEtkinlikler, uyeKatilimi } from "@/lib/istatistik";
import { katalog } from "@/lib/oyun/katalog-sunucu";
import { ekipmanOzeti } from "@/lib/oyun/ozet";
import { acildiMi, gunMetni, saatMetni, simdi } from "@/lib/time";
import { yetkiYeterli } from "@/lib/types";

export const metadata: Metadata = { title: "Üyeler" };

export default async function Uyeler() {
  const kullanici = await requireYetki("uye");
  const v = await veri();
  const [ayar, karakterler, profiller, hazirliklar, asamalar, etkinlikler, turler, yoklamalar, buildler, irklar] = await Promise.all([
    v.ayarlar.ayarlar(), v.uyeler.karakterler(), v.uyeler.profiller(), v.hazirlik.hazirliklar(), v.asamalar.asamalar(),
    v.etkinlikler.etkinlikler(), v.etkinlikler.turler(), v.yoklamalar.yoklamalar(), v.buildler.kayitliBuildler(), v.oyun.irklar(),
  ]);
  const su = simdi();
  const acik = acildiMi(ayar.acilisAt, su);
  const yetkili = yetkiYeterli(kullanici.profil.yetki, "yetkili");
  const gecmis = gecmisEtkinlikler(etkinlikler, turler, su).map((e) => e.id);
  const kat = katalog();
  const adimlar = HAZIRLIK.filter((t) => !t.acilistanSonra);

  const satirlar: UyeSatiri[] = karakterler.map((k) => {
    const h = hazirliklar.find((x) => x.profileId === k.profileId);
    const build = buildler.find((b) => b.characterId === k.id);
    const benim = k.profileId === kullanici.profil.id;
    let ekipman: UyeSatiri["ekipman"] = { tur: "yok" };
    if (build) {
      const irk = irkBul(irklar, build.sinif, ayar.irk, build.irkTuru);
      const ozet = ekipmanOzeti(build, irk, kat, k.ad);
      const lv = build.level === 83 && build.reb ? `83+${build.reb}` : build.level;
      const meta = `${irk.ad} · Level ${lv} · ${gunMetni(build.updatedAt)} ${saatMetni(build.updatedAt)} kaydedildi${k.ekipmanGorunur === "gizli" ? " · Gizli, yalnızca sen görüyorsun" : ""}`;
      ekipman = { tur: "var", ozet, gizli: k.ekipmanGorunur === "gizli", meta };
    } else if (k.ekipmanGorunur === "gizli" && !benim) ekipman = { tur: "gizli" };
    return {
      id: k.id, ad: k.ad, tsNick: profiller.find((p) => p.id === k.profileId)?.tsNick ?? null, sinif: k.sinif, rutbe: k.rutbe,
      level: k.level, reb: k.reb, durum: k.durum, notlar: yetkili ? k.notlar : null, hesapVar: !!k.profileId, benim,
      hazirlik: adimlar.map((t) => {
        const acilis = acilisAni(t, asamalar);
        const kilitli = !!acilis && Date.parse(acilis) > su.getTime();
        const tamam = !!h?.[t.adim];
        return { ad: t.ad, durum: kilitli ? "kilitli" : tamam ? "tamam" : "yok", ipucu: `${t.ad}: ${kilitli ? `${gunMetni(acilis!)}’da açılır` : tamam ? "tamam" : "yapılmadı"}` };
      }),
      katilim: uyeKatilimi(gecmis, yoklamalar, k.id),
      ekipman,
    };
  });
  const aktifler = karakterler.filter((k) => k.durum !== "ayrildi");

  return (
    <>
      <SayfaBasligi ust="Kadro" baslik="Üyeler" aciklama={acik ? "Level, rütbe ve son etkinliklere katılım bir arada." : "Açılıştan önce kimin hangi sınıfı açacağını ve hazırlık adımlarını buradan izleyin."} />
      <div className="grid">
        <Panel className="s12 roster-sum">
          <div style={{ minWidth: 0 }}>
            <div className="panel-h"><h2>Sınıf dağılımı</h2><span className="sub">{aktifler.length} karakter</span></div>
            <SinifDagilimi karakterler={aktifler} irk={ayar.irk} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="panel-h"><h2>Rütbeler</h2></div>
            <div className="ranks">
              {RUTBELER.map((r) => (
                <div key={r}><b className="num">{aktifler.filter((k) => k.rutbe === r).length}</b><span style={{ color: RUTBE_RENGI[r] }}>{RUTBE_ADI[r]}</span></div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel className="s12">
          <UyeTablosu satirlar={satirlar} irk={ayar.irk} acik={acik} yetkili={yetkili} />
        </Panel>
      </div>
    </>
  );
}
