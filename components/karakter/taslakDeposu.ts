"use client";
// Karakter tasarımının kaydedilmemiş taslağı tarayıcıda tutulur (kişiye özel kolaylık): sayfa yenilenince ya da
// Eşyalar'dan "Tak" denince kaybolmasın. Kalıcı kayıt "Build'i kaydet" ile sunucuya gider.
import type { Taslak } from "@/lib/oyun/build";

const anahtar = (profilId: string) => `l4bel:taslak:${profilId}`;

export function taslakOku(profilId: string): Taslak | null {
  try {
    const x = localStorage.getItem(anahtar(profilId));
    if (!x) return null;
    const t = JSON.parse(x) as Taslak;
    return t && typeof t === "object" && t.statlar && Array.isArray(t.skiller) && t.ekipman && t.ekler ? t : null;
  } catch {
    return null;
  }
}

export function taslakYaz(profilId: string, t: Taslak) {
  try { localStorage.setItem(anahtar(profilId), JSON.stringify(t)); } catch { /* özel pencere ya da kota: taslak tutulmaz */ }
}

export function taslakSil(profilId: string) {
  try { localStorage.removeItem(anahtar(profilId)); } catch { /* yok say */ }
}
