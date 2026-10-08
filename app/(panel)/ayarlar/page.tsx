import type { Metadata } from "next";
import { type DavetSatiri, Davetler, type HesapSatiri, Hesaplar, type KatilimSatiri } from "@/components/ayarlar/Davetler";
import { AcilisTakvimi, type AsamaSatiri, KlanBilgisi } from "@/components/ayarlar/KlanBilgisi";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { Panel } from "@/components/ui/Panel";
import { requireYetki } from "@/lib/auth";
import { LEVEL_SECENEKLERI, asamadanForm, davetDurumu } from "@/lib/ayarlar";
import { veri } from "@/lib/data";
import { levelSiniriMetni } from "@/lib/data/settings";
import { RUTBE_ADI } from "@/lib/etiketler";
import { asamaTarihi } from "@/lib/istatistik";
import { gunMetni, saatMetni, tsiGunu } from "@/lib/time";
import type { Yetki } from "@/lib/types";

export const metadata: Metadata = { title: "Ayarlar" };

const YETKI_SIRASI: Record<Yetki, number> = { yonetici: 0, yetkili: 1, uye: 2 };
const anMetni = (iso: string) => `${gunMetni(iso)} ${saatMetni(iso)}`;

export default async function Ayarlar() {
  const kullanici = await requireYetki("yetkili");
  const yonetici = kullanici.profil.yetki === "yonetici";
  const v = await veri();
  const [ayar, asamalar, kodlar, katilimlar, profiller, karakterler] = await Promise.all([
    v.ayarlar.ayarlar(), v.asamalar.asamalar(), v.davetler.kodlar(), v.davetler.katilimlar(), v.uyeler.profiller(), v.uyeler.karakterler(),
  ]);
  const anaKarakter = (profilId: string | null) => karakterler.find((k) => k.profileId === profilId && k.anaKarakter) ?? karakterler.find((k) => k.profileId === profilId);
  const nick = (profilId: string | null) => anaKarakter(profilId)?.ad ?? "—";

  const asamaSatirlari: AsamaSatiri[] = asamalar.map((a) => ({ id: a.id, sira: a.sira, baslik: a.baslik, tarih: asamaTarihi(a), aciklama: a.aciklama, form: asamadanForm(a) }));
  const davetSatirlari: DavetSatiri[] = kodlar.map((k) => ({
    id: k.id, sonDort: k.sonDort, rutbe: RUTBE_ADI[k.rutbe], kullanim: `${k.kullanim} / ${k.maxKullanim}`,
    bitis: anMetni(k.bitis), durum: davetDurumu(k), aciklama: k.aciklama, olusturan: nick(k.olusturan),
  }));
  const katilimSatirlari: KatilimSatiri[] = katilimlar.map((x) => ({
    nick: nick(x.profileId), karakterId: anaKarakter(x.profileId)?.id ?? null, kod: kodlar.find((k) => k.id === x.codeId)?.sonDort ?? "????", tarih: anMetni(x.createdAt),
  }));
  const hesaplar: HesapSatiri[] = profiller
    .map((p) => {
      const k = anaKarakter(p.id);
      const ben = p.id === kullanici.profil.id;
      return {
        profilId: p.id, karakterId: k?.id ?? null, nick: k?.ad ?? "—", rutbe: k ? RUTBE_ADI[k.rutbe] : "—", yetki: p.yetki,
        sonGiris: p.sonGiris ? anMetni(p.sonGiris) : "Hiç girmedi", ben,
        sifirlanabilir: !ben && (yonetici || p.yetki === "uye"),
      };
    })
    .sort((a, b) => YETKI_SIRASI[a.yetki] - YETKI_SIRASI[b.yetki] || a.nick.localeCompare(b.nick, "tr"));

  return (
    <>
      <SayfaBasligi ust="Yönetim" baslik="Ayarlar"
        aciklama={yonetici ? "Klan bilgisi, açılış takvimi, davet kodları ve panel yetkileri." : "Davet kodları ve şifre sıfırlama. Klan bilgisi ve yetkileri yönetici değiştirir."} />
      <div className="grid">
        <Panel className="s7" baslik="Klan bilgisi" alt={`Level sınırı ${levelSiniriMetni(ayar)}`}>
          <KlanBilgisi yonetici={yonetici} secenekler={LEVEL_SECENEKLERI} deger={{
            klanAdi: ayar.klanAdi, monogram: ayar.monogram, irk: ayar.irk, sunucuAdi: ayar.sunucuAdi ?? "", tsAdres: ayar.tsAdres,
            acilisGun: tsiGunu(ayar.acilisAt), acilisSaat: saatMetni(ayar.acilisAt), levelSiniri: levelSiniriMetni(ayar),
          }} />
        </Panel>
        <Panel className="s5" baslik="Açılış takvimi" alt="Resmi tarihler">
          <AcilisTakvimi asamalar={asamaSatirlari} yonetici={yonetici} />
        </Panel>
        <Panel className="s12" baslik="Davet kodları" alt="Kayıt yalnızca davet koduyla">
          <Davetler kodlar={davetSatirlari} katilimlar={katilimSatirlari} />
        </Panel>
        <Panel className="s12" baslik="Hesaplar ve yetkiler" alt={`${profiller.length} hesap`}>
          <Hesaplar hesaplar={hesaplar} yonetici={yonetici} />
        </Panel>
      </div>
    </>
  );
}
