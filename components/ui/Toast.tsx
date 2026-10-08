"use client";
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";

const ToastBaglami = createContext<(mesaj: string) => void>(() => {});

/** Ekranın altında kısa bildirim; ekran okuyucu duyurur */
export function ToastSaglayici({ children }: { children: ReactNode }) {
  const [mesaj, setMesaj] = useState<string | null>(null);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goster = useCallback((m: string) => {
    setMesaj(m);
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(() => setMesaj(null), 3200);
  }, []);
  return (
    <ToastBaglami.Provider value={goster}>
      {children}
      <div className="toast" role="status" aria-live="polite" hidden={!mesaj}>{mesaj}</div>
    </ToastBaglami.Provider>
  );
}

export const useToast = () => useContext(ToastBaglami);
