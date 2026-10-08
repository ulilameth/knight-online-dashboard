/** Arma: kalkan içinde klan monogramı (clan_settings.monogram) */
export function Arma({ monogram, boyut = 42 }: { monogram: string; boyut?: number }) {
  return (
    <svg width={boyut} height={(boyut * 46) / 42} viewBox="0 0 42 46" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M21 2l17 6.5V22c0 11-7.6 18.6-17 22C11.6 40.6 4 33 4 22V8.5z" fill="var(--brand)" stroke="var(--gold)" strokeWidth="2" />
      <path d="M21 9v28M13 17h16" stroke="var(--gold)" strokeWidth="2" opacity=".55" />
      <text x="21" y="28" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="13" fill="var(--fg)">{monogram}</text>
    </svg>
  );
}
