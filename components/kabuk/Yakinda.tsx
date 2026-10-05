import { Panel } from "@/components/ui/Panel";

/** Faz 1 oturumları gelene kadar sekmelerin yer tutucusu */
export function Yakinda({ baslik, ust, oturum, veri }: { baslik: string; ust: string; oturum: string; veri: string }) {
  return (
    <>
      <SayfaBasligi ust={ust} baslik={baslik} />
      <Panel>
        <p className="text-metin">Bu ekran yapım aşamasında ({oturum}). Arka ucu hazır: <code className="text-altin">{veri}</code>.</p>
      </Panel>
    </>
  );
}

export function SayfaBasligi({ ust, baslik, aciklama }: { ust: string; baslik: string; aciklama?: string }) {
  return (
    <div className="mb-6">
      <div className="font-ui text-sm font-semibold uppercase tracking-[0.2em] text-marka-yazi">{ust}</div>
      <h1 className="font-display text-3xl font-bold text-baslik">{baslik}</h1>
      {aciklama && <p className="mt-1 max-w-2xl text-metin">{aciklama}</p>}
    </div>
  );
}
