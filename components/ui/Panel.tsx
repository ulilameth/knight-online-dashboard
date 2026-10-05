import type { ReactNode } from "react";

export function Panel({ baslik, sag, children, className = "" }: { baslik?: ReactNode; sag?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-cizgi bg-kart p-5 shadow-[var(--shadow-card)] ${className}`}>
      {(baslik || sag) && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          {baslik && <h2 className="font-ui text-xl font-semibold text-baslik">{baslik}</h2>}
          {sag && <div className="text-sm text-soluk">{sag}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
