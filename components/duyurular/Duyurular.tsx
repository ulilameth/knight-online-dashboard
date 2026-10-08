"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { DuyuruKarti } from "@/components/ortak/DuyuruKarti";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFormAksiyonu } from "@/components/ui/useFormAksiyonu";
import { type IslemSonucu, duyuruKaydetAksiyonu, duyuruSabitleAksiyonu, duyuruSilAksiyonu, duyuruTsGonderAksiyonu } from "@/lib/actions/takvim";
import type { Duyuru } from "@/lib/types";

export interface DuyuruSatiri {
  duyuru: Duyuru;
  yazar: string;
  /** Panoya kopyalanacak düz metin */
  kopya: string;
}

const kutuStili = { textTransform: "none", letterSpacing: 0, font: "400 14px var(--font-body)", color: "var(--fg)" } as const;

/** Duyuru yazma formu (yeni ya da düzenleme). Yayınlanınca temizlenir. */
function DuyuruFormu({ d, tsAcik, bitti }: { d?: Duyuru; tsAcik: boolean; bitti?: () => void }) {
  const toast = useToast();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<IslemSonucu>>(duyuruKaydetAksiyonu);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!durum?.tamam) return;
    toast(durum.hata ? `${durum.tamam}. ${durum.hata}` : durum.tamam);
    form.current?.reset();
    bitti?.();
  }, [durum, toast, bitti]);
  const onek = d ? `d-${d.id}` : "ann";
  return (
    <form ref={form} action={gonder.action} onSubmit={gonder.onSubmit} className="form" style={d ? { marginBottom: 0 } : undefined} noValidate>
      {d && <input type="hidden" name="id" value={d.id} />}
      <div><label htmlFor={`${onek}-title`}>Başlık</label><input type="text" id={`${onek}-title`} name="baslik" maxLength={120} defaultValue={d?.baslik} placeholder="Örn. Pazar CSW kadrosu" /></div>
      <div><label htmlFor={`${onek}-body`}>Duyuru</label><textarea id={`${onek}-body`} name="govde" maxLength={4000} defaultValue={d?.govde} placeholder="Kısa ve net yazın. Saat verirken TSİ kullanın." /></div>
      <div className="row">
        <div className="opts">
          <label className="check" htmlFor={`${onek}-pin`} style={kutuStili}><input type="checkbox" id={`${onek}-pin`} name="sabit" defaultChecked={d?.sabit} />Sabitle</label>
          {tsAcik && !d && <label className="check" htmlFor={`${onek}-ts`} style={kutuStili}><input type="checkbox" id={`${onek}-ts`} name="ts" defaultChecked />TeamSpeak’e de gönder</label>}
        </div>
        <button className="btn primary" type="submit" disabled={bekliyor}>{bekliyor ? "Kaydediliyor…" : d ? "Kaydet" : "Yayınla"}</button>
      </div>
      {durum?.hata && !durum.tamam && <p className="crit-note" role="alert" style={{ margin: 0 }}>{durum.hata}</p>}
    </form>
  );
}

export function Duyurular({ satirlar, yetkili, tsAcik }: { satirlar: DuyuruSatiri[]; yetkili: boolean; tsAcik: boolean }) {
  const toast = useToast();
  const [bekliyor, gecis] = useTransition();
  const [pencere, setPencere] = useState<{ tur: "duzenle" | "sil"; d: Duyuru } | null>(null);
  const kapat = useCallback(() => setPencere(null), []);
  const calistir = (is: () => Promise<IslemSonucu>, sonra?: () => void) => gecis(async () => {
    const r = await is();
    toast(r?.hata ?? r?.tamam ?? "");
    if (!r?.hata) sonra?.();
  });
  const kopyala = async (metin: string) => {
    try {
      await navigator.clipboard.writeText(metin);
      toast("Duyuru metni kopyalandı; TeamSpeak’e yapıştırabilirsin");
    } catch {
      toast("Kopyalanamadı; metni seçip kopyala");
    }
  };

  return (
    <>
      {yetkili && <DuyuruFormu tsAcik={tsAcik} />}
      {satirlar.map(({ duyuru: d, yazar, kopya }) => (
        <DuyuruKarti key={d.id} duyuru={d} yazar={yazar} ek={
          <>
            <button type="button" className="mini" onClick={() => kopyala(kopya)}>Metni kopyala</button>
            {yetkili && (
              <>
                {tsAcik && <button type="button" className="mini" disabled={bekliyor} onClick={() => calistir(() => duyuruTsGonderAksiyonu(d.id))}>{d.tsGonderildiAt ? "TS’e tekrar gönder" : "TS’e gönder"}</button>}
                <button type="button" className="mini" disabled={bekliyor} onClick={() => calistir(() => duyuruSabitleAksiyonu(d.id, !d.sabit))}>{d.sabit ? "Sabitlemeyi kaldır" : "Sabitle"}</button>
                <button type="button" className="mini" onClick={() => setPencere({ tur: "duzenle", d })}>Düzenle</button>
                <button type="button" className="mini" onClick={() => setPencere({ tur: "sil", d })}>Sil</button>
              </>
            )}
          </>
        } />
      ))}
      {!satirlar.length && <div className="empty">Henüz duyuru yok.</div>}
      {pencere?.tur === "duzenle" && (
        <Modal acik kapat={kapat} baslik="Duyuruyu düzenle">
          <DuyuruFormu d={pencere.d} tsAcik={tsAcik} bitti={kapat} />
        </Modal>
      )}
      {pencere?.tur === "sil" && (
        <Modal acik kapat={kapat} baslik="Duyuruyu sil" genislik={440}>
          <p style={{ marginTop: 0 }}><b>{pencere.d.baslik}</b> silinecek. Bu geri alınamaz{pencere.d.tsGonderildiAt ? "; TeamSpeak’e giden mesaj geri alınmaz" : ""}.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn" onClick={kapat}>Vazgeç</button>
            <button type="button" className="btn primary" disabled={bekliyor} onClick={() => calistir(() => duyuruSilAksiyonu(pencere.d.id), kapat)}>{bekliyor ? "Siliniyor…" : "Sil"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
