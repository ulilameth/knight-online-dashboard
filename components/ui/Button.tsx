import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tur = "birincil" | "ikincil";
const sinif = (tur: Tur, ek = "") => `btn ${tur === "birincil" ? "primary" : ""} ${ek}`.trim();

export function Button({ tur = "ikincil", className = "", type = "button", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { tur?: Tur }) {
  return <button type={type} {...p} className={sinif(tur, className)} />;
}

export function LinkButton({ href, tur = "ikincil", className = "", children }: { href: string; tur?: Tur; className?: string; children: ReactNode }) {
  return <Link href={href} className={sinif(tur, className)}>{children}</Link>;
}
