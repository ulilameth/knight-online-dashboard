import Link from "next/link";
import { Ikon } from "@/components/ui/Ikon";
import { type Ay, type TakvimOgesi, ayIzgarasi, ayKaydir, ayMetni } from "@/lib/takvim";
import { bicimle } from "@/lib/time";

const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const ogle = (gun: string) => `${gun}T09:00:00Z`;

function Cip({ o }: { o: TakvimOgesi }) {
  const icerik = <><span className="t">{o.saat}</span>{o.kisa}</>;
  const sinif = `ev ${o.resmi ? "official" : ""}`;
  return o.etkinlikId
    ? <Link href={`/etkinlikler?e=${encodeURIComponent(o.etkinlikId)}`} className={sinif} title={o.baslik}>{icerik}</Link>
    : <span className={sinif} title={o.baslik}>{icerik}</span>;
}

/** Aylık takvim (geniş ekran) ve ajanda (telefon); resmi tarihler altın renkte */
export function AyTakvimi({ ay, ogeler, bugun }: { ay: Ay; ogeler: TakvimOgesi[]; bugun: string }) {
  const gunler = ayIzgarasi(ay);
  const buAy = ayMetni(ay);
  const gunun = (g: string) => ogeler.filter((o) => o.gun === g);
  const ajanda = [...new Set(ogeler.filter((o) => o.gun.startsWith(buAy)).map((o) => o.gun))];
  const baslik = bicimle(ogle(`${buAy}-01`), { month: "long", year: "numeric" });
  return (
    <>
      <div className="panel-h">
        <div className="cal-nav">
          <Link href={`/takvim?ay=${ayMetni(ayKaydir(ay, -1))}`} className="icon-btn" aria-label="Önceki ay" scroll={false}><Ikon ad="i-left" /></Link>
          <h2 aria-live="polite">{baslik}</h2>
          <Link href={`/takvim?ay=${ayMetni(ayKaydir(ay, 1))}`} className="icon-btn" aria-label="Sonraki ay" scroll={false}><Ikon ad="i-right" /></Link>
        </div>
        <Link href="/takvim" className="btn" scroll={false}>Bugün</Link>
      </div>
      <div className="month-wrap">
        <div className="month">
          {GUNLER.map((g) => <div className="dow" key={g}>{g}</div>)}
          {gunler.map((g) => (
            <div key={g} className={`day ${g.startsWith(buAy) ? "" : "out"} ${g === bugun ? "today" : ""}`}>
              <span className="dn num">{Number(g.slice(8))}</span>
              {gunun(g).map((o) => <Cip key={o.id} o={o} />)}
            </div>
          ))}
        </div>
      </div>
      <div className="agenda">
        {ajanda.map((g) => (
          <div key={g} className={`ag-day ${g === bugun ? "today" : ""}`}>
            <h3>{bicimle(ogle(g), { day: "numeric", month: "long", weekday: "long" })}</h3>
            {gunun(g).map((o) => <Cip key={o.id} o={o} />)}
          </div>
        ))}
        {!ajanda.length && <div className="empty">Bu ay etkinlik yok.</div>}
      </div>
    </>
  );
}
