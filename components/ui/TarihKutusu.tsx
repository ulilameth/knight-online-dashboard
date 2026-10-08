import { bicimle } from "@/lib/time";

/** Listelerdeki tarih kutusu: gün ve kısa ay (TSİ) */
export function TarihKutusu({ iso }: { iso: string }) {
  return (
    <div className="date" aria-hidden="true">
      <b>{bicimle(iso, { day: "numeric" })}</b>
      <span>{bicimle(iso, { month: "short" }).replace(".", "")}</span>
    </div>
  );
}
