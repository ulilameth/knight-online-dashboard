import type { ReactNode } from "react";

/** Küçük etiket; resmi: altın zeminli ("Resmi", "Sen") */
export function Tag({ children, resmi = false }: { children: ReactNode; resmi?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-ui text-sm font-semibold ${resmi ? "border-transparent bg-altin-sis text-altin" : "border-cizgi text-soluk"}`}>
      {children}
    </span>
  );
}
