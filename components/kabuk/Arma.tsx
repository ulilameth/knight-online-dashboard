/** Üst bardaki arma: kalkan içinde klan monogramı (klan_settings.monogram) */
export function Arma({ monogram, boyut = 40 }: { monogram: string; boyut?: number }) {
  return (
    <svg width={boyut} height={boyut * 1.15} viewBox="0 0 40 46" aria-hidden="true" className="shrink-0">
      <path d="M20 2 37 8v14c0 11-7.4 18.6-17 22C10.4 40.6 3 33 3 22V8z" fill="var(--brand)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="20" y="27" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="13" fill="var(--text-on-brand)">{monogram}</text>
    </svg>
  );
}
