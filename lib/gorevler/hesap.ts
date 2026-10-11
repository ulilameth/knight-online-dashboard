// Görevler ekranının hesapları: oyuncunun aralığı, sınıra göre öneri, EXP ve bar yüzdesi metinleri, filtreler.
import type { Taraf } from "@/lib/types";
import { aradaki, barYuzdesi } from "./exp";
import { ARALIKLAR, type Aralik, type AralikId, GOREV_KARSILAMA, type Gorev, type Oneri } from "./veri";

export const ONERI_ADI: Record<Oneri, string> = {
  hemen: "Hemen yap", ertele: "Ertele", sakla: "83'e sakla", atla: "Atla", istege: "İsteğe bağlı",
};
export const ONERI_SIRASI: readonly Oneri[] = ["hemen", "ertele", "sakla", "istege", "atla"];
/** Pill rengi */
export const ONERI_TURU: Record<Oneri, "good" | "warn" | "idle" | "crit"> = {
  hemen: "good", ertele: "warn", sakla: "warn", istege: "idle", atla: "crit",
};

/** Levelin içinde bulunduğu aralık (aralığın son leveli bir sonrakine aittir: 10 → 10–20) */
export function aralikOf(level: number): Aralik {
  const l = Math.max(1, Math.floor(level));
  return ARALIKLAR.find((a) => l >= a.levelMin && l < a.levelMax) ?? ARALIKLAR[ARALIKLAR.length - 1];
}

/** Sınır 83 olunca "83'e sakla" görevleri "Hemen yap"a döner */
export function oneriOf(g: Pick<Gorev, "oneri">, levelSiniri: 80 | 83): Oneri {
  return g.oneri === "sakla" && levelSiniri === 83 ? "hemen" : g.oneri;
}

/** Görevi veren NPC: klanın tarafındaki */
export function npcOf(g: Pick<Gorev, "npc">, taraf: Taraf): string {
  if ("ikisi" in g.npc) return g.npc.ikisi;
  return taraf === "el_morad" ? g.npc.elmorad : g.npc.karus;
}

const sayi = (n: number, basamak: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: basamak });

/** 15.125 · 4,9M · 170,25M · 1,09 milyar */
export function expMetni(n: number): string {
  if (n >= 1e9) return `${sayi(n / 1e9, 2)} milyar`;
  if (n >= 1e6) return `${sayi(n / 1e6, n >= 1e8 ? 1 : 2)}M`;
  return sayi(n, 0);
}

/** Ödülün o leveldeki bara oranı: "%34 bar", "11,2 bar" */
export function barMetni(exp: number, level: number): string {
  const y = barYuzdesi(exp, level);
  if (y >= 100) return `${sayi(y / 100, 1)} bar`;
  if (y < 1) return "<%1 bar";
  return `%${Math.round(y)} bar`;
}

export interface GorevFiltresi {
  aralik: AralikId | "";
  oneri: Oneri | "";
  ara: string;
  yapilanlariGizle: boolean;
}

/** Türkçe "I" küçülünce "ı" olur; İngilizce görev adlarında "Iron" "iron" ile bulunsun */
const duz = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i");

export function gorevFiltrele(gorevler: readonly Gorev[], f: GorevFiltresi, levelSiniri: 80 | 83, yapilanlar: ReadonlySet<string>, taraf: Taraf): Gorev[] {
  const q = duz(f.ara.trim());
  return gorevler.filter((g) =>
    (!f.aralik || g.aralik === f.aralik)
    && (!f.oneri || oneriOf(g, levelSiniri) === f.oneri)
    && (!f.yapilanlariGizle || !yapilanlar.has(g.id))
    && (!q || duz([g.ad, npcOf(g, taraf), g.bolge, g.hedef ?? "", g.odul ?? ""].join(" ")).includes(q)));
}

/** "Atla" dışındaki görevlerden kaçı işaretli */
export function ilerleme(gorevler: readonly Gorev[], levelSiniri: 80 | 83, yapilanlar: ReadonlySet<string>) {
  const sayilan = gorevler.filter((g) => oneriOf(g, levelSiniri) !== "atla");
  return { yapilan: sayilan.filter((g) => yapilanlar.has(g.id)).length, toplam: sayilan.length };
}

/** Görev EXP'sinin aralık ihtiyacını karşılama oranı (mob EXP'si hariç) */
export function karsilama() {
  return GOREV_KARSILAMA.map((r) => {
    const ihtiyac = aradaki(r.a, r.b);
    return { ...r, ihtiyac, oran: r.gorevExp / ihtiyac };
  });
}
