const ADIMLAR = ["Davet kodu", "Hesap", "Karakter", "Hoş geldin"];

/** Kayıt akışının adım başlığı ve 4 parçalı ilerleme çubuğu */
export function KayitAdimi({ adim, baslik }: { adim: number; baslik: string }) {
  return (
    <div className="mb-5">
      <ol className="mb-4 grid grid-cols-4 gap-1.5" aria-label={`Kayıt: adım ${adim} / ${ADIMLAR.length}`}>
        {ADIMLAR.map((ad, i) => (
          <li key={ad} aria-current={i + 1 === adim ? "step" : undefined} className="flex flex-col gap-1">
            <span className={`h-1 rounded-full ${i + 1 <= adim ? "bg-altin" : "bg-cizgi"}`} />
            <span className={`hidden font-ui text-xs uppercase tracking-wider sm:block ${i + 1 === adim ? "text-baslik" : "text-soluk"}`}>{ad}</span>
          </li>
        ))}
      </ol>
      <div className="font-ui text-sm font-semibold uppercase tracking-widest text-marka-yazi">Adım {adim} / {ADIMLAR.length}</div>
      <h1 className="font-ui text-2xl font-semibold text-baslik">{baslik}</h1>
    </div>
  );
}
