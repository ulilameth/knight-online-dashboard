"use client";
import { type InputHTMLAttributes, useState } from "react";

/** Şifre kutusu, göster/gizle düğmesiyle (telefonda yazım hatası görülsün diye) */
export function SifreAlani({ etiket, ipucu, id, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { etiket: string; ipucu?: string; id: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-ui text-sm font-semibold uppercase tracking-wider text-soluk">{etiket}</label>
      <div className="relative">
        <input
          id={id}
          {...p}
          type={acik ? "text" : "password"}
          aria-describedby={ipucu ? `${id}-ipucu` : undefined}
          className="min-h-11 w-full rounded-lg border border-girdi bg-kutu py-2 pl-3 pr-20 text-base text-baslik placeholder:text-soluk"
        />
        <button
          type="button"
          onClick={() => setAcik((x) => !x)}
          aria-pressed={acik}
          aria-label={acik ? `${etiket}: gizle` : `${etiket}: göster`}
          className="absolute inset-y-1 right-1 rounded-md px-3 font-ui text-sm font-semibold text-soluk hover:bg-zemin hover:text-baslik"
        >
          {acik ? "Gizle" : "Göster"}
        </button>
      </div>
      {ipucu && <p id={`${id}-ipucu`} className="text-sm text-soluk">{ipucu}</p>}
    </div>
  );
}
