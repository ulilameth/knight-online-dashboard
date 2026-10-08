import type { Metadata } from "next";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { ProfilFormu } from "@/components/profil/ProfilFormu";
import { LinkButton } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { RUTBE_ADI, RUTBE_RENGI, YETKI_ADI } from "@/lib/etiketler";
import { levelSiniriMetni } from "@/lib/data/settings";
import { acildiMi, gunMetni, saatMetni, simdi, tamMetin } from "@/lib/time";
import { yetkiYeterli } from "@/lib/types";

export const metadata: Metadata = { title: "Profilim" };

export default async function Profil() {
  const k = await requireYetki("uye");
  const ayar = await (await veri()).ayarlar.ayarlar();
  const kr = k.karakter;
  return (
    <>
      <SayfaBasligi ust="Hesabım" baslik="Profilim" aciklama="Sınıfını ve levelini kendin güncelle; değişiklik üye listesine hemen yansır. Nick’ini ve rütbeni yetkililer değiştirir." />
      <div className="grid">
        <Panel className="s7" baslik="Karakterim" sag={kr && <span className="sub">TS: {k.profil.tsNick ?? "—"} · <span style={{ color: RUTBE_RENGI[kr.rutbe], fontWeight: 600 }}>{RUTBE_ADI[kr.rutbe]}</span> · {YETKI_ADI[k.profil.yetki]}</span>}>
          {kr ? (
            <ProfilFormu p={{
              nick: kr.ad, tsNick: k.profil.tsNick ?? "", sinif: kr.sinif, level: kr.level, reb: kr.reb, ekipmanGorunur: kr.ekipmanGorunur,
              tsAdres: ayar.tsAdres, irk: ayar.irk, acik: acildiMi(ayar.acilisAt, simdi()), acilisMetni: tamMetin(ayar.acilisAt),
              levelSiniri: ayar.levelSiniri, rebSiniri: ayar.rebSiniri,
              sonGuncelleme: `${gunMetni(kr.guncellendiAt)} ${saatMetni(kr.guncellendiAt)}`,
            }} />
          ) : <p className="muted">Hesabına bağlı karakter yok. Bir yetkiliye yaz.</p>}
        </Panel>
        <Panel className="s5" baslik="Kim neyi değiştirir">
          <ul className="list who-edits">
            <li><span>Sınıf, level, reb</span><Tag resmi>Sen</Tag></li>
            <li><span>TeamSpeak nick, şifre</span><Tag resmi>Sen</Tag></li>
            <li><span>Hazırlık adımları</span><Tag resmi>Sen</Tag></li>
            <li><span>Ekipmanın kimlere görünür</span><Tag resmi>Sen</Tag></li>
            <li><span>Nick, rütbe, durum</span><Tag>Yetkililer</Tag></li>
            <li><span>Sunucu level sınırı (şu an {levelSiniriMetni(ayar)})</span><Tag>Yönetici</Tag></li>
          </ul>
          {yetkiYeterli(k.profil.yetki, "yetkili") && (
            <div style={{ marginTop: 14 }}><LinkButton href="/ayarlar">Ayarlar’a git</LinkButton></div>
          )}
        </Panel>
      </div>
    </>
  );
}
