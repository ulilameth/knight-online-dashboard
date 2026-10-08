"use client";
import { useState } from "react";

const oku = (s: string) => (/^\d+$/.test(s.trim()) ? parseInt(s, 10) : null);

/**
 * Elle yazılabilen sayı kutusu (stat, skill, level). Yazarken geçerliyse hemen uygulanır (son=false);
 * kutudan çıkınca ya da Enter'da aralığa göre düzeltilir (son=true). Ok tuşları 1, Shift ile 10 adım.
 */
export function SayiKutusu({ id, deger, enAz = 0, onYaz, etiket, baslik, uzunluk = 3, devreDisi, asim, placeholder }: {
  id: string;
  deger: number;
  enAz?: number;
  onYaz: (v: number | null, son: boolean) => void;
  etiket: string;
  baslik?: string;
  uzunluk?: number;
  devreDisi?: boolean;
  asim?: boolean;
  placeholder?: string;
}) {
  const [yazilan, setYazilan] = useState<string | null>(null);
  return (
    <input
      id={id} type="text" inputMode="numeric" maxLength={uzunluk} autoComplete="off" className={`num ${asim ? "over" : ""}`}
      value={devreDisi ? "" : yazilan ?? String(deger)} placeholder={placeholder} aria-label={etiket} title={baslik} disabled={devreDisi}
      onFocus={(e) => { setYazilan(String(deger)); e.currentTarget.select(); }}
      onChange={(e) => { setYazilan(e.target.value); onYaz(oku(e.target.value), false); }}
      onBlur={(e) => { onYaz(oku(e.target.value), true); setYazilan(null); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.currentTarget.blur(); return; }
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const adim = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1);
        onYaz(Math.max(enAz, deger + adim), true);
        setYazilan(null);
      }}
    />
  );
}
