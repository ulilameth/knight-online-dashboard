"use client";
import { type ReactNode, useEffect, useRef } from "react";
import { Ikon } from "./Ikon";

/** Prototipin pencere kalıbı (picker-back + picker): Esc ve arka plan tıklaması kapatır, odak geri döner */
export function Modal({ acik, kapat, baslik, genislik = 560, children }: {
  acik: boolean;
  kapat: () => void;
  baslik: ReactNode;
  genislik?: number;
  children: ReactNode;
}) {
  const kapatDugmesi = useRef<HTMLButtonElement>(null);
  const onceki = useRef<Element | null>(null);
  useEffect(() => {
    if (!acik) return;
    onceki.current = document.activeElement;
    kapatDugmesi.current?.focus();
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    document.addEventListener("keydown", tus);
    return () => {
      document.removeEventListener("keydown", tus);
      if (onceki.current instanceof HTMLElement) onceki.current.focus();
    };
  }, [acik, kapat]);
  if (!acik) return null;
  return (
    <div className="picker-back" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
      <div className="picker" role="dialog" aria-modal="true" aria-label={typeof baslik === "string" ? baslik : undefined} style={{ width: `min(${genislik}px, 100%)` }}>
        <div className="pk-head">
          <h2>{baslik}</h2>
          <button type="button" className="icon-btn" ref={kapatDugmesi} onClick={kapat} aria-label="Kapat"><Ikon ad="i-x" /></button>
        </div>
        <div style={{ overflow: "auto", minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}
