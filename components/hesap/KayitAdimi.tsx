/** Kayıt akışının adım başlığı (4 adım) */
export function KayitAdimi({ adim, baslik }: { adim: number; baslik: string }) {
  return (
    <div className="mb-4">
      <div className="font-ui text-sm font-semibold uppercase tracking-widest text-marka-yazi">Adım {adim} / 4</div>
      <h1 className="font-ui text-2xl font-semibold text-baslik">{baslik}</h1>
    </div>
  );
}
