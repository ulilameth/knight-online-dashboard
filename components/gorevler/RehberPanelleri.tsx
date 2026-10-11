// Görevler sayfasının sabit panelleri (sunucuda çizilir): görev payı, etkinlikler, EXP bonusları, günlük düzen, sınıf notları, kaynaklar.
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { SINIF_KISA, sinifAdi } from "@/lib/etiketler";
import { EXP_TABLOSU_KAYNAK, aradaki } from "@/lib/gorevler/exp";
import { expMetni, karsilama } from "@/lib/gorevler/hesap";
import {
  BONUS_NOTU, BUFFLAR, type Bonus, ETKINLIKLER, GUNLUK_DUZEN, KAYNAKLAR, KOBUGDA_GOREVLER, type Kanit, PREMIUMLAR, SINIF_NOTLARI, SINIF_ORTAK_NOTU,
} from "@/lib/gorevler/veri";
import type { Sinif, Taraf } from "@/lib/types";

const KANIT_ADI: Record<Kanit, string> = {
  confirmed_2026: "2026 sunucuları için",
  existing_servers: "Mevcut sunucular",
  precedent_2022: "2022 açılışı",
  precedent_older: "Eski",
  community: "Topluluk",
};

const sayi = (n: number) => n.toLocaleString("tr-TR");

export function GorevPayi() {
  const satirlar = karsilama();
  const toplam = aradaki(1, 80);
  return (
    <Panel baslik="Görevler ne kadarını karşılar" alt="Görev EXP’si ÷ aralığın ihtiyacı">
      <div className="bars">
        {satirlar.map((r) => {
          const y = Math.round(r.oran * 100);
          return (
            <div className="bar-row hitrow" key={r.ad} tabIndex={0} title={`${r.ad}: görevler ${expMetni(r.gorevExp)}, ihtiyaç ${expMetni(r.ihtiyac)} EXP (%${y})`}>
              <div className="lab">{r.ad}<small>{expMetni(r.ihtiyac)} EXP</small></div>
              <div className="track"><i style={{ width: `${Math.min(100, y)}%`, ...(y < 100 && { background: "var(--warn)" }) }} /></div>
              <div className="val num">%{y}</div>
            </div>
          );
        })}
      </div>
      <div className="axis" aria-hidden="true">
        <span />
        <div><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        <span />
      </div>
      <p className="muted" style={{ fontSize: 13.5, margin: "14px 0 0" }}>
        1→80 toplam {expMetni(toplam)} EXP; bunun %{Math.round((aradaki(70, 80) / toplam) * 100)}’i 70→80 arasında. 70’e kadar görevler yeter (turuncu çubuklar dolmaz):
        sonrasında farkı EXP Premium’lu Eslant partisi, Border Defense War ve buff’lar kapatır. Mob EXP’si hariç.
      </p>
    </Panel>
  );
}

export function Etkinlikler() {
  return (
    <Panel baslik="EXP veren etkinlikler" alt="Saatler mevcut sunuculardan, TSİ">
      <div className="table-wrap">
        <table style={{ minWidth: 680 }}>
          <thead><tr><th>Etkinlik</th><th>Level</th><th>Saat</th><th>Ne verir</th><th>2022 açılışında</th></tr></thead>
          <tbody>
            {ETKINLIKLER.map((e) => (
              <tr key={e.ad}><td className="name"><b>{e.ad}</b></td><td>{e.seviye}</td><td>{e.saat}</td><td>{e.deger}</td><td>{e.acilista}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function BonusListesi({ baslik, liste }: { baslik: string; liste: Bonus[] }) {
  return (
    <>
      <h3 className="gq-grup">{baslik}</h3>
      <ul className="rules">
        {liste.map((b) => (
          <li key={b.ad}><span><b>{b.ad}</b>{b.not && <span className="muted" style={{ display: "block", fontSize: 13 }}>{b.not}</span>}</span><Tag>{b.deger}</Tag></li>
        ))}
      </ul>
    </>
  );
}

export function Bonuslar() {
  return (
    <Panel baslik="EXP bonusları" alt="Premium ve buff’lar">
      <BonusListesi baslik="Premium" liste={PREMIUMLAR} />
      <BonusListesi baslik="Buff ve eşyalar" liste={BUFFLAR} />
      <p className="callout" style={{ marginTop: 12 }}>{BONUS_NOTU}</p>
    </Panel>
  );
}

export function GunlukDuzen() {
  return (
    <Panel baslik="Günlük düzen" alt="Her gün aynı sırayla">
      <ol className="gq-adimlar">
        {GUNLUK_DUZEN.map((s) => <li key={s}>{s}</li>)}
      </ol>
    </Panel>
  );
}

export function SinifNotlari({ sinif, taraf }: { sinif: Sinif | null; taraf: Taraf }) {
  return (
    <Panel baslik="Sınıfa göre" alt="Kasma, master ve skill görevleri">
      <div className="table-wrap">
        <table style={{ minWidth: 860 }}>
          <thead><tr><th>Sınıf</th><th>Solo</th><th>Partide</th><th>Master (60)</th><th title="70, 75 ve 80 skill görevleri için toplam Spell Stone Powder">Powder</th><th>Dikkat</th></tr></thead>
          <tbody>
            {SINIF_NOTLARI.map((n) => (
              <tr key={n.sinif} className={n.sinif === sinif ? "gq-sen" : undefined}>
                <td className="name"><span className="cls"><i className={`c-${SINIF_KISA[n.sinif]}`} />{sinifAdi(n.sinif, taraf)}</span>{n.sinif === sinif && <> <Tag resmi>Sen</Tag></>}</td>
                <td>{n.solo}</td><td>{n.parti}</td><td>{n.master}</td><td className="num">{n.powder}</td><td>{n.dikkat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13.5, margin: "12px 0 0" }}>{SINIF_ORTAK_NOTU}</p>
    </Panel>
  );
}

export function Kaynaklar() {
  const k = EXP_TABLOSU_KAYNAK.kontrol;
  return (
    <Panel baslik="Kaynaklar ve doğrulama" alt="Değerler eski sunuculardan: açılışta oyunda kontrol et">
      <p className="crit-note" style={{ marginTop: 0 }}>
        <b>EXP tablosu doğrulanmadı.</b> Hesaplar <a href={EXP_TABLOSU_KAYNAK.url} target="_blank" rel="noopener">{EXP_TABLOSU_KAYNAK.ad}</a> ile yapıldı; bir emülatör tablosu her levelde tam 4 katını veriyor.
        Açılışta {k.level}. levelde EXP barına bak: {sayi(k.a)} ise tablo doğru, {sayi(k.emulator)} ise bütün bar oranları ve görev payları 4’te birine iner.
      </p>
      <details className="gq-kaynaklar">
        <summary>Kaynak listesi ({Object.keys(KAYNAKLAR).length})</summary>
        <ul className="rules">
          {Object.values(KAYNAKLAR).map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noopener">{s.baslik}</a><Tag>{KANIT_ADI[s.kanit]} · {s.tarih}</Tag></li>
          ))}
        </ul>
      </details>
      <p className="muted" style={{ fontSize: 13.5, margin: "12px 0 0" }}>
        Görev, NPC, mob ve bölge adları oyundaki İngilizce halleriyle. Tüm görevlerin tam listesi için <a href={KOBUGDA_GOREVLER} target="_blank" rel="noopener">KO Bugda görev veritabanı</a>.
      </p>
    </Panel>
  );
}
