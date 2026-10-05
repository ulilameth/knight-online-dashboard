import type { ReactNode } from "react";
import { Arma } from "@/components/kabuk/Arma";
import { veri } from "@/lib/data";

/** Giriş, kayıt ve şifre sıfırlama: ortada tek kart */
export default async function HesapDuzeni({ children }: { children: ReactNode }) {
  const a = await (await veri()).ayarlar.ayarlar();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-3">
        <Arma monogram={a.monogram} boyut={48} />
        <div>
          <div className="font-display text-3xl font-bold tracking-wide text-baslik">{a.klanAdi}</div>
          <div className="font-ui text-sm uppercase tracking-[0.2em] text-soluk">Klan paneli</div>
        </div>
      </div>
      <section className="rounded-xl border border-cizgi bg-kart p-6 shadow-[var(--shadow-card)]">{children}</section>
    </main>
  );
}
