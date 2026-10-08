import { SINIF_KISA, sinifAdi } from "@/lib/etiketler";
import { sinifDagilimi } from "@/lib/istatistik";
import type { Karakter, Taraf } from "@/lib/types";

/** Yığılmış sınıf çubuğu ve açıklaması */
export function SinifDagilimi({ karakterler, irk }: { karakterler: Karakter[]; irk: Taraf }) {
  const d = sinifDagilimi(karakterler).filter((x) => x.adet > 0);
  const toplam = d.reduce((a, x) => a + x.adet, 0) || 1;
  return (
    <>
      <div className="stackbar" role="img" aria-label={d.map((x) => `${sinifAdi(x.sinif, irk)} ${x.adet}`).join(", ")}>
        {d.map((x) => (
          <span key={x.sinif} className={`c-${SINIF_KISA[x.sinif]}`} style={{ flex: x.adet }} title={`${sinifAdi(x.sinif, irk)}: ${x.adet} üye (%${Math.round((x.adet / toplam) * 100)})`}>{x.adet}</span>
        ))}
      </div>
      <div className="legend">
        {sinifDagilimi(karakterler).map((x) => (
          <span className="cls" key={x.sinif}><i className={`c-${SINIF_KISA[x.sinif]}`} /><b>{sinifAdi(x.sinif, irk)}</b><span>{x.adet}</span></span>
        ))}
      </div>
    </>
  );
}
