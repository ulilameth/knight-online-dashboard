import type { ReactNode } from "react";
import { DURUM_ADI } from "@/lib/etiketler";
import type { KarakterDurum, Sinif, Taraf } from "@/lib/types";
import { SINIF_KISA, sinifAdi } from "@/lib/etiketler";

export type PillTuru = "good" | "warn" | "crit" | "idle";

/** Durum rozeti: renk + nokta + yazı (renk tek başına anlam taşımaz) */
export function Pill({ tur, children }: { tur: PillTuru; children: ReactNode }) {
  return <span className={`pill ${tur}`}>{children}</span>;
}

const DURUM_TURU: Record<KarakterDurum, PillTuru> = { aktif: "good", izinli: "warn", pasif: "idle", ayrildi: "crit" };
export function DurumPill({ durum }: { durum: KarakterDurum }) {
  return <Pill tur={DURUM_TURU[durum]}>{DURUM_ADI[durum]}</Pill>;
}

/** Sınıf: renkli kare + ad (El Morad'da Kurian yerine Porutu) */
export function SinifEtiketi({ sinif, irk }: { sinif: Sinif | null; irk: Taraf }) {
  if (!sinif) return <span className="muted">Seçilmedi</span>;
  return <span className="cls"><i className={`c-${SINIF_KISA[sinif]}`} />{sinifAdi(sinif, irk)}</span>;
}

/** İnce ilerleme çubuğu (0-100) */
export function Meter({ yuzde, etiket }: { yuzde: number; etiket?: string }) {
  return (
    <div className="meter" role="img" aria-label={etiket ?? `%${Math.round(yuzde)}`}>
      <i style={{ width: `${Math.max(0, Math.min(100, yuzde))}%` }} />
    </div>
  );
}
