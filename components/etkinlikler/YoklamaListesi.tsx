"use client";
import { useOptimistic, useTransition } from "react";
import { Pill } from "@/components/ui/Durum";
import { useToast } from "@/components/ui/Toast";
import { yoklamaAksiyonu } from "@/lib/actions/etkinlikler";
import { RUTBE_ADI, SINIF_KISA, YOKLAMA_ADI, YOKLAMA_DURUMLARI, YOKLAMA_TURU, sinifAdi } from "@/lib/etiketler";
import type { Rutbe, Sinif, Taraf, YoklamaDurumu } from "@/lib/types";

export interface KadroUyesi {
  id: string;
  ad: string;
  sinif: Sinif | null;
  rutbe: Rutbe;
}

type Isaretler = Record<string, YoklamaDurumu>;

/** Prototipin .mark düğmelerinin data-s değerleri (renkler CSS'te) */
const MARK_S: Record<YoklamaDurumu, string> = { katildi: "present", gec: "late", mazeretli: "excused", yok: "absent" };

/** Etkinlik detayındaki sayım, toplu işaretleme ve kadro. Yetkili tek tıkla işaretler; aynı düğmeye tekrar basmak işareti kaldırır. */
export function YoklamaListesi({ eventId, kadro, isaretler, yetkili, irk }: {
  eventId: string;
  kadro: KadroUyesi[];
  isaretler: Isaretler;
  yetkili: boolean;
  irk: Taraf;
}) {
  const toast = useToast();
  const [, gecis] = useTransition();
  const [gorunen, uygula] = useOptimistic(isaretler, (s: Isaretler, d: { ids: string[]; durum: YoklamaDurumu | null }) => {
    const yeni = { ...s };
    for (const id of d.ids) {
      if (d.durum) yeni[id] = d.durum;
      else delete yeni[id];
    }
    return yeni;
  });

  const isaretle = (ids: string[], durum: YoklamaDurumu | null) => {
    if (!ids.length) return;
    gecis(async () => {
      uygula({ ids, durum });
      const r = await yoklamaAksiyonu(eventId, ids, durum);
      if (r.hata) toast(r.hata);
    });
  };

  const say = (d: YoklamaDurumu) => kadro.filter((k) => gorunen[k.id] === d).length;
  const bos = kadro.filter((k) => !gorunen[k.id]).map((k) => k.id);

  return (
    <>
      <div className="summary" aria-live="polite">
        {YOKLAMA_DURUMLARI.map((d) => <Pill key={d} tur={YOKLAMA_TURU[d]}>{YOKLAMA_ADI[d]} {say(d)}</Pill>)}
        {bos.length > 0 && <Pill tur="idle">İşaretlenmedi {bos.length}</Pill>}
      </div>
      {yetkili && (
        <div className="bulk">
          <button type="button" className="btn" disabled={!bos.length} onClick={() => isaretle(bos, "katildi")}>Boşları katıldı yap</button>
          <button type="button" className="btn" disabled={!bos.length} onClick={() => isaretle(bos, "yok")}>Boşları yok yap</button>
        </div>
      )}
      <ul className="roster">
        {kadro.map((k) => {
          const s = gorunen[k.id];
          return (
            <li key={k.id}>
              <div className="who">
                <span className="cls">{k.sinif && <i className={`c-${SINIF_KISA[k.sinif]}`} />}</span>
                <b>{k.ad}</b>
                <span className="muted" style={{ fontSize: 13 }}>{k.sinif ? sinifAdi(k.sinif, irk) : "Sınıf yok"} · {RUTBE_ADI[k.rutbe]}</span>
              </div>
              {yetkili ? (
                <div className="mark" role="group" aria-label={`${k.ad} katılımı`}>
                  {YOKLAMA_DURUMLARI.map((d) => (
                    <button type="button" key={d} data-s={MARK_S[d]} aria-pressed={s === d} onClick={() => isaretle([k.id], s === d ? null : d)}>{YOKLAMA_ADI[d]}</button>
                  ))}
                </div>
              ) : s ? <Pill tur={YOKLAMA_TURU[s]}>{YOKLAMA_ADI[s]}</Pill> : <span className="muted">—</span>}
            </li>
          );
        })}
      </ul>
      {!kadro.length && <div className="empty">Kadroda üye yok.</div>}
    </>
  );
}
