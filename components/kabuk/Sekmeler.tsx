"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Sekme {
  href: string;
  ad: string;
}

/** Sekme rayı: etkin sekme marka renginde alt çizgiyle */
export function Sekmeler({ sekmeler }: { sekmeler: Sekme[] }) {
  const yol = usePathname();
  const etkin = (href: string) => (href === "/" ? yol === "/" : yol === href || yol.startsWith(`${href}/`));
  return (
    <nav className="tabs" aria-label="Bölümler">
      <div className="tabs-in">
        {sekmeler.map((s) => (
          <Link key={s.href} href={s.href} className="tab" aria-current={etkin(s.href) ? "page" : undefined} aria-selected={etkin(s.href)}>
            {s.ad}
          </Link>
        ))}
      </div>
    </nav>
  );
}
