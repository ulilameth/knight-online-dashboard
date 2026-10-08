"use client";
import { useEffect, useRef } from "react";

/** Tek sütunlu (dar) düzende listeden etkinlik seçilince detaya kaydırır; ilk açılışta kaydırmaz */
export function DetayaKaydir({ hedef, secili }: { hedef: string; secili: string | undefined }) {
  const ilk = useRef(true);
  useEffect(() => {
    if (ilk.current) { ilk.current = false; return; }
    if (window.matchMedia("(max-width: 900px)").matches) document.getElementById(hedef)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hedef, secili]);
  return null;
}
