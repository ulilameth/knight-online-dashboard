"use client";
import { type ReactNode, startTransition, useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormMesaji } from "@/components/ui/FormMesaji";
import type { FormDurumu } from "@/lib/actions/auth";

/** Server Action'a bağlı form: hata/başarı mesajı ve gönderilirken kapalı düğme */
export function AksiyonFormu({ aksiyon, dugme, children }: {
  aksiyon: (durum: FormDurumu, form: FormData) => Promise<FormDurumu>;
  dugme: string;
  children: ReactNode;
}) {
  const [durum, gonder, bekliyor] = useActionState(aksiyon, null);
  return (
    <form
      action={gonder}
      // JavaScript açıkken formu kendimiz gönderiyoruz: React hata sonrası alanları sıfırlamasın (nick yeniden yazılmasın)
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => gonder(veri));
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      {children}
      <FormMesaji durum={durum} />
      <Button type="submit" disabled={bekliyor}>{bekliyor ? "Bekle…" : dugme}</Button>
    </form>
  );
}
