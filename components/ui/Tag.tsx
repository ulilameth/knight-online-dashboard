import type { ReactNode } from "react";

/** Küçük etiket; resmi: altın zeminli ("Resmi", "Sen") */
export function Tag({ children, resmi = false, title }: { children: ReactNode; resmi?: boolean; title?: string }) {
  return <span className={`tag ${resmi ? "official" : ""}`} title={title}>{children}</span>;
}
