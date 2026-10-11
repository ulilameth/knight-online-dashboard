// Rotanın altındaki Rehber sekmelerinin içerikleri (sunucuda çizilir): günlük düzen, etkinlikler, EXP bonusları, sınıf notları, kaynaklar.
import { Tag } from "@/components/ui/Tag";
import { SINIF_KISA, sinifAdi } from "@/lib/etiketler";
import { EXP_TABLOSU_KAYNAK } from "@/lib/gorevler/exp";
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

export function GunlukDuzen() {
  return (
    <ol className="rh-adimlar">
      {GUNLUK_DUZEN.map((s) => <li key={s}>{s}</li>)}
    </ol>
  );
}

export function Etkinlikler() {
  return (
    <>
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
      <p className="rh-not">Saatler mevcut sunuculardan (TSİ); yeni sunucularda değişebilir.</p>
    </>
  );
}

function BonusListesi({ baslik, liste }: { baslik: string; liste: Bonus[] }) {
  return (
    <section>
      <h3 className="rh-baslik">{baslik}</h3>
      <ul className="rh-bonus">
        {liste.map((b) => (
          <li key={b.ad}><span><b>{b.ad}</b>{b.not && <small>{b.not}</small>}</span><span className="num">{b.deger}</span></li>
        ))}
      </ul>
    </section>
  );
}

export function Bonuslar() {
  return (
    <>
      <div className="rh-iki">
        <BonusListesi baslik="Premium" liste={PREMIUMLAR} />
        <BonusListesi baslik="Buff ve eşyalar" liste={BUFFLAR} />
      </div>
      <p className="rh-not">{BONUS_NOTU}</p>
    </>
  );
}

export function SinifNotlari({ sinif, taraf }: { sinif: Sinif | null; taraf: Taraf }) {
  return (
    <>
      <div className="table-wrap">
        <table style={{ minWidth: 860 }}>
          <thead><tr><th>Sınıf</th><th>Solo</th><th>Partide</th><th>Master (60)</th><th title="70, 75 ve 80 skill görevleri için toplam Spell Stone Powder">Powder</th><th>Dikkat</th></tr></thead>
          <tbody>
            {SINIF_NOTLARI.map((n) => (
              <tr key={n.sinif} className={n.sinif === sinif ? "rh-sen" : undefined}>
                <td className="name"><span className="cls"><i className={`c-${SINIF_KISA[n.sinif]}`} />{sinifAdi(n.sinif, taraf)}</span>{n.sinif === sinif && <> <Tag resmi>Sen</Tag></>}</td>
                <td>{n.solo}</td><td>{n.parti}</td><td>{n.master}</td><td className="num">{n.powder}</td><td>{n.dikkat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="rh-not">{SINIF_ORTAK_NOTU}</p>
    </>
  );
}

export function Kaynaklar() {
  const k = EXP_TABLOSU_KAYNAK.kontrol;
  return (
    <>
      <p className="crit-note" style={{ marginTop: 0 }}>
        <b>EXP tablosu doğrulanmadı.</b> Hesaplar <a href={EXP_TABLOSU_KAYNAK.url} target="_blank" rel="noopener">{EXP_TABLOSU_KAYNAK.ad}</a> ile yapıldı; bir emülatör tablosu her levelde tam 4 katını veriyor.
        Açılışta {k.level}. levelde EXP barına bak: {sayi(k.a)} ise tablo doğru, {sayi(k.emulator)} ise bütün bar oranları ve görev payları 4’te birine iner.
      </p>
      <ul className="rules" style={{ marginTop: 12 }}>
        {Object.values(KAYNAKLAR).map((s) => (
          <li key={s.url}><a href={s.url} target="_blank" rel="noopener">{s.baslik}</a><Tag>{KANIT_ADI[s.kanit]} · {s.tarih}</Tag></li>
        ))}
      </ul>
      <p className="rh-not">
        Görev, NPC, mob ve bölge adları oyundaki İngilizce halleriyle; değerler eski sunuculardan, açılışta oyunda kontrol edilmeli. Tüm görevlerin tam listesi için <a href={KOBUGDA_GOREVLER} target="_blank" rel="noopener">KO Bugda görev veritabanı</a>.
      </p>
    </>
  );
}
