import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AksiyonFormu } from "@/components/hesap/AksiyonFormu";
import { Alan } from "@/components/ui/Alan";
import { karakterAksiyonu } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { veri } from "@/lib/data";
import { SINIFLAR, sinifAdi } from "@/lib/etiketler";
import { KayitAdimi } from "@/components/hesap/KayitAdimi";

export const metadata: Metadata = { title: "Karakterin" };

export default async function Karakter() {
  const k = await getCurrentUser();
  if (!k) redirect("/giris");
  const a = await (await veri()).ayarlar.ayarlar();
  return (
    <>
      <KayitAdimi adim={3} baslik="Karakterin" />
      <p className="mb-4 text-metin">Açılıştan önce planladığın sınıfı seç; levelini sunucu açılınca Profilim’den girersin.</p>
      <AksiyonFormu aksiyon={karakterAksiyonu} dugme="Kaydet ve devam et">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 font-ui text-sm font-semibold uppercase tracking-wider text-soluk">Sınıf</legend>
          <div className="grid grid-cols-2 gap-2">
            {SINIFLAR.map((s) => (
              <label key={s} className="flex min-h-11 items-center gap-2 rounded-lg border border-girdi bg-kutu px-3 has-[:checked]:border-altin">
                <input type="radio" name="sinif" value={s} defaultChecked={k.karakter?.sinif === s} required />
                <span className="font-ui font-semibold text-baslik">{sinifAdi(s, a.irk)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Alan id="tsNick" name="tsNick" etiket="TeamSpeak nick" ipucu={`TeamSpeak’te (${a.tsAdres}) görünen adın; isteğe bağlı.`} maxLength={30} defaultValue={k.profil.tsNick ?? ""} autoComplete="off" />
      </AksiyonFormu>
    </>
  );
}
