import type { InputHTMLAttributes } from "react";

/** Etiketli metin kutusu; hata ve ipucu metni aria-describedby ile bağlanır */
export function Alan({ etiket, ipucu, id, className = "", ...p }: InputHTMLAttributes<HTMLInputElement> & { etiket: string; ipucu?: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-ui text-sm font-semibold uppercase tracking-wider text-soluk">{etiket}</label>
      <input
        id={id}
        {...p}
        aria-describedby={ipucu ? `${id}-ipucu` : undefined}
        className={`min-h-11 rounded-lg border border-girdi bg-kutu px-3 text-base text-baslik placeholder:text-soluk ${className}`}
      />
      {ipucu && <p id={`${id}-ipucu`} className="text-sm text-soluk">{ipucu}</p>}
    </div>
  );
}
