"use client";
import { useOptimistic, useTransition } from "react";
import { Ikon } from "@/components/ui/Ikon";
import { useToast } from "@/components/ui/Toast";
import { hazirlikAksiyonu } from "@/lib/actions/genel";
import type { HazirlikAdimi } from "@/lib/data/prep";

export interface Adim {
  adim: HazirlikAdimi;
  ad: string;
  acik: boolean;
  /** Açılmadıysa "15 Ekim’de açılır" */
  kilit?: string;
  isaretli: boolean;
}

/** Üyenin kendi hazırlık kutuları: tıklayınca hemen işaretlenir, sunucuya yazılır */
export function BenimHazirligim({ adimlar }: { adimlar: Adim[] }) {
  const toast = useToast();
  const [, gecis] = useTransition();
  const [durum, guncelle] = useOptimistic(adimlar, (eski, { adim, deger }: { adim: HazirlikAdimi; deger: boolean }) =>
    eski.map((a) => (a.adim === adim ? { ...a, isaretli: deger } : a)));
  return (
    <div className="checks">
      {durum.map((a) => (
        <label key={a.adim} className={`check ${a.acik ? "" : "dis"}`} htmlFor={`mine-${a.adim}`} title={a.kilit}>
          <input
            type="checkbox"
            id={`mine-${a.adim}`}
            checked={a.acik && a.isaretli}
            disabled={!a.acik}
            onChange={(e) => {
              const deger = e.target.checked;
              gecis(async () => {
                guncelle({ adim: a.adim, deger });
                const s = await hazirlikAksiyonu(a.adim, deger);
                toast(s.hata ?? (deger ? `${a.ad}: tamam` : `${a.ad}: işaret kaldırıldı`));
              });
            }}
          />
          {a.ad}
          {!a.acik && <span className="locked"><Ikon ad="i-lock" /></span>}
        </label>
      ))}
    </div>
  );
}
