"use client";
// "Yaptım" işaretleri tarayıcıda tutulur (kişiye özel kolaylık, sunucuya gitmez). Aynı sekmedeki ve diğer
// sekmelerdeki değişiklikler useSyncExternalStore ile dinlenir.

const anahtar = (profilId: string) => `l4bel:gorevler:${profilId}`;
const dinleyiciler = new Set<() => void>();

export function yapilanlaraAbone(f: () => void) {
  dinleyiciler.add(f);
  window.addEventListener("storage", f);
  return () => {
    dinleyiciler.delete(f);
    window.removeEventListener("storage", f);
  };
}

/** Ham JSON metni (anlık görüntü değerle karşılaştırılsın diye); yoksa ya da okunamazsa "" */
export function yapilanlariOku(profilId: string): string {
  try {
    const x = localStorage.getItem(anahtar(profilId));
    return x && Array.isArray(JSON.parse(x)) ? x : "";
  } catch {
    return "";
  }
}

function yaz(profilId: string, f: (s: Set<string>) => void) {
  const ham = yapilanlariOku(profilId);
  const s = new Set<string>(ham ? (JSON.parse(ham) as string[]) : []);
  f(s);
  try { localStorage.setItem(anahtar(profilId), JSON.stringify([...s])); } catch { /* özel pencere ya da kota: işaret tutulmaz */ }
  dinleyiciler.forEach((d) => d());
}

export const gorevYaz = (profilId: string, id: string) => yaz(profilId, (s) => s.add(id));
export const gorevSil = (profilId: string, id: string) => yaz(profilId, (s) => s.delete(id));
