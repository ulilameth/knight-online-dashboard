import type { ReactNode } from "react";

/** Sayfa başlığı: üst etiket, başlık, açıklama; sağda düğme */
export function SayfaBasligi({ ust, baslik, aciklama, sag }: { ust: string; baslik: string; aciklama?: ReactNode; sag?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{ust}</div>
        <h1>{baslik}</h1>
        {aciklama && <p>{aciklama}</p>}
      </div>
      {sag}
    </div>
  );
}
