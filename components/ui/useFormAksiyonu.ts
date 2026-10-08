"use client";
import { type FormEvent, startTransition, useActionState } from "react";

/**
 * Server Action'a bağlı form: React'in gönderimden sonra alanları sıfırlamasını önler (hata alınca kullanıcı
 * yazdıklarını yeniden yazmasın). Kullanım: const [durum, gonder, bekliyor] = useFormAksiyonu(aksiyon);
 * <form action={gonder.action} onSubmit={gonder.onSubmit}>
 */
export function useFormAksiyonu<S>(aksiyon: (durum: S | null, form: FormData) => Promise<S | null>) {
  const [durum, calistir, bekliyor] = useActionState<S | null, FormData>(aksiyon, null);
  const gonder = {
    action: calistir,
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const veri = new FormData(e.currentTarget);
      startTransition(() => calistir(veri));
    },
  };
  return [durum, gonder, bekliyor] as const;
}
