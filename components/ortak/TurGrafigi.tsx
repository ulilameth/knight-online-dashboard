import type { TurSatiri } from "@/lib/istatistik";

/** Etkinlik türüne göre katılım çubukları (0-100 ızgaralı) */
export function TurGrafigi({ satirlar }: { satirlar: TurSatiri[] }) {
  return (
    <>
      <div className="bars">
        {satirlar.map((r) => (
          <div className="bar-row hitrow" key={r.tur.kod} tabIndex={0} title={`${r.tur.ad}: ${r.etkinlik} etkinlik, ${r.gelen} / ${r.isaretli} katılım (%${r.yuzde})`}>
            <div className="lab">{r.tur.kisaAd}<small>{r.etkinlik} etkinlik</small></div>
            <div className="track"><i style={{ width: `${r.yuzde}%` }} /></div>
            <div className="val num">%{r.yuzde}</div>
          </div>
        ))}
      </div>
      <div className="axis" aria-hidden="true">
        <span />
        <div><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        <span />
      </div>
    </>
  );
}
