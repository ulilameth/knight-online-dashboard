"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Sekme {
  href: string;
  ad: string;
}

/** Ana gezinme; etkin sekme marka renginde alt çizgiyle */
export function Sekmeler({ sekmeler }: { sekmeler: Sekme[] }) {
  const yol = usePathname();
  const etkin = (href: string) => (href === "/" ? yol === "/" : yol === href || yol.startsWith(`${href}/`));
  return (
    <nav aria-label="Ana menü" className="-mb-px flex gap-1 overflow-x-auto">
      {sekmeler.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={etkin(s.href) ? "page" : undefined}
          className={`whitespace-nowrap border-b-2 px-3 py-3 font-ui text-base font-semibold transition-colors ${etkin(s.href) ? "border-marka-yazi text-baslik" : "border-transparent text-soluk hover:text-baslik"}`}
        >
          {s.ad}
        </Link>
      ))}
    </nav>
  );
}
