"use client";
import { useEffect, useState } from "react";
import { type Katalog, type KatalogJson, kataloguHazirla } from "@/lib/oyun/katalog";

// Katalog (public/katalog.json, ~560 KB) sayfa başına bir kez indirilir ve sekmeler arasında paylaşılır
let yukleniyor: Promise<Katalog> | null = null;
let hazir: Katalog | null = null;

function yukle(): Promise<Katalog> {
  yukleniyor ??= fetch("/katalog.json")
    .then((r) => (r.ok ? (r.json() as Promise<KatalogJson>) : Promise.reject(new Error(String(r.status)))))
    .then((j) => (hazir = kataloguHazirla(j)))
    .catch((e) => { yukleniyor = null; throw e; });
  return yukleniyor;
}

export type KatalogDurumu = { kat: Katalog; hata: false } | { kat: null; hata: boolean };

export function useKatalog(): KatalogDurumu {
  const [durum, setDurum] = useState<KatalogDurumu>(() => (hazir ? { kat: hazir, hata: false } : { kat: null, hata: false }));
  useEffect(() => {
    if (hazir) return;
    let iptal = false;
    yukle().then((kat) => { if (!iptal) setDurum({ kat, hata: false }); }, () => { if (!iptal) setDurum({ kat: null, hata: true }); });
    return () => { iptal = true; };
  }, []);
  return durum;
}
