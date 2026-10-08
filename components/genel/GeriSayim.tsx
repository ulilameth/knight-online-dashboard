"use client";
import { useEffect, useState } from "react";

const iki = (n: number) => String(n).padStart(2, "0");

/**
 * Saniyelik geri sayım. Sunucunun "şimdi"si verilir: demo modunda DEMO_SIMDI ile kaydırılmış zaman da doğru akar.
 * İlk çizim sunucuyla aynı olsun diye saniyeler hidrasyondan sonra başlar.
 */
export function GeriSayim({ hedef, sunucuSimdi }: { hedef: string; sunucuSimdi: string }) {
  const [kalan, setKalan] = useState(() => Math.max(0, Date.parse(hedef) - Date.parse(sunucuSimdi)));
  useEffect(() => {
    const fark = Date.parse(sunucuSimdi) - Date.now();
    const guncelle = () => setKalan(Math.max(0, Date.parse(hedef) - (Date.now() + fark)));
    guncelle();
    const t = setInterval(guncelle, 1000);
    return () => clearInterval(t);
  }, [hedef, sunucuSimdi]);
  const gun = Math.floor(kalan / 86_400_000), saat = Math.floor((kalan % 86_400_000) / 3_600_000);
  const dk = Math.floor((kalan % 3_600_000) / 60_000), sn = Math.floor((kalan % 60_000) / 1000);
  return (
    <div className="count" aria-label={`${gun} gün ${saat} saat ${dk} dakika kaldı`} role="timer">
      {([["Gün", gun], ["Saat", saat], ["Dakika", dk], ["Saniye", sn]] as const).map(([ad, n]) => (
        <div className="unit" key={ad} aria-hidden="true"><b>{iki(n)}</b><span>{ad}</span></div>
      ))}
    </div>
  );
}
