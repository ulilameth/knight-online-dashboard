import type { ReactNode } from "react";

/** Prototipin paneli: başlık, sağda alt yazı ya da düğme */
export function Panel({ baslik, alt, sag, className = "", id, children }: {
  baslik?: ReactNode;
  alt?: ReactNode;
  sag?: ReactNode;
  className?: string;
  id?: string;
  children?: ReactNode;
}) {
  return (
    <section className={`panel ${className}`} id={id}>
      {(baslik || alt || sag) && (
        <div className="panel-h">
          {baslik && <h2>{baslik}</h2>}
          {alt && <span className="sub">{alt}</span>}
          {sag}
        </div>
      )}
      {children}
    </section>
  );
}
