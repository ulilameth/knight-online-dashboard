// Görevler ekranının hesapları: rota durakları ve oyuncunun yeri, sınıra göre öneri, kısa adlar, EXP ve bar yüzdesi metinleri, arama.
import type { Taraf } from "@/lib/types";
import { aradaki, barYuzdesi } from "./exp";
import { ARALIKLAR, type Aralik, GOREV_KARSILAMA, type Gorev, type Oneri } from "./veri";

/** Durakta görevler öneriye göre bu sırayla ve bu başlıklarla gruplanır */
export const ONERI_SIRASI: readonly Oneri[] = ["hemen", "istege", "ertele", "sakla", "atla"];
export const ONERI_BASLIGI: Record<Oneri, string> = {
  hemen: "Önce bunlar", istege: "İsteğe bağlı", ertele: "Sonraya bırak", sakla: "83 açılınca", atla: "Atla",
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

/**
 * Birleşik satırın kısa adı: "Nightmare (1) / Nightmare (2)" → "Nightmare (1–2)";
 * farklı görevlerde ilk ad ve kaç görev daha olduğu ("Lamia Hunt" +5). Tam liste ayrıntıda.
 */
export function kisaAd(ad: string): { baslik: string; ek: number; parcalar: string[] } {
  const parcalar = ad.split(" / ").map((s) => s.trim());
  if (parcalar.length === 1) return { baslik: ad, ek: 0, parcalar };
  const m = parcalar.map((s) => /^(.*) \((\d+)\)$/.exec(s));
  if (m.every((x) => x && x[1] === m[0]![1])) return { baslik: `${m[0]![1]} (${m[0]![2]}–${m.at(-1)![2]})`, ek: 0, parcalar };
  return { baslik: parcalar[0], ek: parcalar.length - 1, parcalar };
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

/** Türkçe "I" küçülünce "ı" olur; İngilizce görev adlarında "Iron" "iron" ile bulunsun */
const duz = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i");

/** Görev adında (birleşik satırın bütün parçaları dahil), NPC'de (klanın tarafındaki), hedefte ve ödülde arar */
export function gorevAra(gorevler: readonly Gorev[], ara: string, taraf: Taraf): Gorev[] {
  const q = duz(ara.trim());
  if (!q) return [...gorevler];
  return gorevler.filter((g) => duz([g.ad, npcOf(g, taraf), g.hedef ?? "", g.odul ?? ""].join(" ")).includes(q));
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

/** Durağın görev payı: aralığı kapsayan satır (45–50 ve 50–60 için 45–60); 80–83 için yok */
export const durakPayi = (a: Pick<Aralik, "levelMin" | "levelMax">) =>
  karsilama().find((r) => r.a <= a.levelMin && a.levelMax <= r.b);

export type DurakDurumu = "gecti" | "burada" | "ileride" | "kilitli";

/** Oyuncunun leveline göre durak: geçti, burada, ileride; sınırın üstündeyse kilitli */
export function durakDurumu(a: Pick<Aralik, "id" | "levelMin" | "levelMax">, level: number, levelSiniri: 80 | 83): DurakDurumu {
  if (a.levelMin >= levelSiniri) return "kilitli";
  if (aralikOf(level).id === a.id) return "burada";
  return a.levelMax <= level ? "gecti" : "ileride";
}
