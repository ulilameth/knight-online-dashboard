/** Form sonucu: hata kırmızı, başarı yeşil; ekran okuyucu duyurur */
export function FormMesaji({ durum }: { durum: { hata?: string; tamam?: string } | null }) {
  if (!durum?.hata && !durum?.tamam) return null;
  const hata = !!durum.hata;
  return (
    <p role={hata ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm ${hata ? "bg-hata-sis text-hata" : "bg-basari-sis text-basari"}`}>
      {durum.hata ?? durum.tamam}
    </p>
  );
}
