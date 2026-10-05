import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tur = "birincil" | "ikincil";
const SINIF: Record<Tur, string> = {
  birincil: "bg-marka text-[var(--text-on-brand)] border-marka hover:bg-marka-hover hover:border-marka-hover",
  ikincil: "bg-transparent text-baslik border-girdi hover:bg-kutu",
};
const ORTAK = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 font-ui text-base font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ tur = "birincil", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { tur?: Tur }) {
  return <button {...p} className={`${ORTAK} ${SINIF[tur]} ${className}`} />;
}

export function LinkButton({ href, tur = "ikincil", children }: { href: string; tur?: Tur; children: ReactNode }) {
  return <Link href={href} className={`${ORTAK} ${SINIF[tur]}`}>{children}</Link>;
}
