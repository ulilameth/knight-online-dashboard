import Link from "next/link";
import { EsyaIkonu } from "@/components/oyun/EsyaIkonu";
import type { EkipmanOzeti } from "@/lib/oyun/ozet";

/** Kayıtlı build'in içeriği: AP, can, mana, savunma, statlar ve takılı eşyalar (pencere ve üye detayı) */
export function EkipmanIcerik({ ozet, meta }: { ozet: EkipmanOzeti; meta?: string }) {
  return (
    <>
      {meta && <p className="mb-meta">{meta}</p>}
      <div className="mb-stats">
        <div><b className="num">{ozet.ap}</b><span>Saldırı (AP)</span></div>
        <div><b className="num">{ozet.can}</b><span>Can (HP)</span></div>
        <div><b className="num">{ozet.mana}</b><span>Mana (MP)</span></div>
        <div><b className="num">{ozet.savunma}</b><span>Savunma</span></div>
      </div>
      <p className="mb-statline">{ozet.statSatiri} <span className="muted">(eşya ve set dahil, buff yok)</span></p>
      {ozet.skiller.some(Boolean) && <p className="mb-statline">Skill: {ozet.skiller.join(" / ")}</p>}
      {ozet.bolumler.length ? ozet.bolumler.map((b) => (
        <div key={b.baslik}>
          <div className="gear-h"><h3 className="calc-h">{b.baslik}{b.setNotu && <> <small>{b.setNotu}</small></>}</h3></div>
          <div className="gear">
            {b.yuvalar.map((y) => (
              <Link key={y.yuva} href={`/esyalar?esya=${y.esyaId}`} className="slot-btn" style={{ textDecoration: "none" }}>
                <EsyaIkonu yuva={y.yuvaTuru} esya={y} />
                <span className="sl"><small>{y.yuva}</small><b>{y.ad}</b><em>+{y.arti}{y.ozet ? ` · ${y.ozet}` : ""}</em></span>
              </Link>
            ))}
          </div>
        </div>
      )) : <p className="muted">Takılı eşya yok.</p>}
    </>
  );
}
