"use client";
import { type ReactNode, useState } from "react";

/** Durak kartının altındaki ipuçları: tek panelde sekmeler (içerik sunucuda çizilir, seçilmeyenler gizli) */
export function RehberSekmeleri({ sekmeler }: { sekmeler: { id: string; ad: string; icerik: ReactNode }[] }) {
  const [secili, setSecili] = useState(sekmeler[0].id);
  return (
    <section className="panel rehber" aria-label="İpuçları">
      <div className="rehber-bas">
        <h2>İpuçları</h2>
        <div className="chips" role="tablist" aria-label="İpucu bölümleri">
          {sekmeler.map((s) => (
            <button type="button" key={s.id} role="tab" id={`rehber-${s.id}`} className="chip" aria-selected={secili === s.id}
              aria-controls={`rehber-${s.id}-panel`} onClick={() => setSecili(s.id)}>{s.ad}</button>
          ))}
        </div>
      </div>
      {sekmeler.map((s) => (
        <div key={s.id} role="tabpanel" id={`rehber-${s.id}-panel`} aria-labelledby={`rehber-${s.id}`} hidden={secili !== s.id}>{s.icerik}</div>
      ))}
    </section>
  );
}
