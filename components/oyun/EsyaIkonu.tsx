import type { EsyaDerecesi, YuvaTuru } from "@/lib/oyun/katalog";

/** Derece renkleri (çerçeve) */
export const DERECE: Record<EsyaDerecesi, [string, string]> = {
  normal: ["Normal", "var(--rank-member)"], set: ["Set", "var(--c-mag)"], unique: ["Unique", "var(--c-six)"],
  rare: ["Rare", "var(--c-pri)"], draki: ["Draki", "var(--c-rog)"], cospre: ["Cospre", "var(--c-kur)"],
};

/** Eşya görseli (yoksa yuva ikonu), çerçeve rengi dereceyi gösterir; boş yuva kesik çizgili */
export function EsyaIkonu({ yuva, esya, boyut }: { yuva: YuvaTuru; esya?: { gorsel: number | null; derece: EsyaDerecesi } | null; boyut?: number }) {
  const ikon = <svg className="ic" aria-hidden="true"><use href={`#s-${yuva.replace("cospre_", "")}`} /></svg>;
  const stil = boyut ? { width: boyut, height: boyut } : undefined;
  if (!esya) return <span className="ico empty" style={stil}>{ikon}</span>;
  return (
    <span className="ico" style={{ ...stil, color: DERECE[esya.derece][1] }}>
      {esya.gorsel == null ? ikon : (
        // eslint-disable-next-line @next/next/no-img-element -- 45×45 oyun görselleri; optimizasyona gerek yok
        <img src={`/esya/${esya.gorsel}.png`} alt="" width={36} height={36} loading="lazy" />
      )}
    </span>
  );
}
