"use client";
import { useState } from "react";

/** Metni panoya kopyalar; 2 saniye "Kopyalandı" gösterir */
export function Kopyala({ metin, etiket = "Kopyala" }: { metin: string; etiket?: string }) {
  const [tamam, setTamam] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(metin); setTamam(true); setTimeout(() => setTamam(false), 2000); } catch { /* izin yoksa metin zaten görünür */ }
      }}
      className="rounded-md border border-girdi px-3 py-1 font-ui text-sm font-semibold text-baslik hover:bg-kutu"
    >
      <span aria-live="polite">{tamam ? "Kopyalandı" : etiket}</span>
    </button>
  );
}
