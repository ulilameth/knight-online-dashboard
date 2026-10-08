import { Panel } from "@/components/ui/Panel";
import { SayfaBasligi } from "./SayfaBasligi";

/** Henüz yazılmamış ekranların yer tutucusu */
export function Yakinda({ baslik, ust }: { baslik: string; ust: string }) {
  return (
    <>
      <SayfaBasligi ust={ust} baslik={baslik} />
      <Panel><p>Bu ekran yapım aşamasında.</p></Panel>
    </>
  );
}
