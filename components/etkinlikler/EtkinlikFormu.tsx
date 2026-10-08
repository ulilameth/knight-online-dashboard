"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Ikon } from "@/components/ui/Ikon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFormAksiyonu } from "@/components/ui/useFormAksiyonu";
import { type EtkinlikSonucu, etkinlikKaydetAksiyonu, etkinlikSilAksiyonu } from "@/lib/actions/etkinlikler";
import type { EtkinlikFormu as Form } from "@/lib/etkinlik";
import type { EtkinlikTuru } from "@/lib/types";

const SURELER = [["", "Belirsiz"], ["30", "30 dk"], ["60", "1 saat"], ["90", "1,5 saat"], ["120", "2 saat"], ["180", "3 saat"]] as const;

function EtkinlikPenceresi({ id, deger, turler, kapat }: { id?: string; deger: Form; turler: EtkinlikTuru[]; kapat: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<EtkinlikSonucu>>(etkinlikKaydetAksiyonu);
  useEffect(() => {
    if (!durum?.tamam) return;
    toast(durum.tamam);
    kapat();
    if (!id && durum.id) router.push(`/etkinlikler?e=${encodeURIComponent(durum.id)}`, { scroll: false });
  }, [durum, toast, kapat, router, id]);
  const sureler = SURELER.some(([v]) => v === deger.sure) ? SURELER : [...SURELER, [deger.sure, `${deger.sure} dk`] as const];
  return (
    <Modal acik kapat={kapat} baslik={id ? "Etkinliği düzenle" : "Etkinlik oluştur"}>
      <form action={gonder.action} onSubmit={gonder.onSubmit} className="form" style={{ marginBottom: 0 }} noValidate>
        {id && <input type="hidden" name="id" value={id} />}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <div><label htmlFor="e-tur">Tür</label><select className="sel" id="e-tur" name="tur" defaultValue={deger.tur} style={{ width: "100%", marginTop: 6 }}>
            {turler.map((t) => <option key={t.kod} value={t.kod}>{t.ad}</option>)}</select></div>
          <div><label htmlFor="e-sure">Süre</label><select className="sel" id="e-sure" name="sure" defaultValue={deger.sure} style={{ width: "100%", marginTop: 6 }}>
            {sureler.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <div><label htmlFor="e-baslik">Başlık</label><input type="text" id="e-baslik" name="baslik" defaultValue={deger.baslik} maxLength={120} required autoComplete="off" placeholder="Örn. Pazar CSW" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <div><label htmlFor="e-tarih">Tarih</label><input type="date" id="e-tarih" name="tarih" defaultValue={deger.tarih} required /></div>
          <div><label htmlFor="e-saat">Saat (TSİ)</label><input type="time" id="e-saat" name="saat" defaultValue={deger.saat} step={300} required /></div>
        </div>
        <div><label htmlFor="e-aciklama">Açıklama</label><textarea id="e-aciklama" name="aciklama" defaultValue={deger.aciklama} maxLength={1000} placeholder="Toplanma yeri, kadro, TS kanalı…" /></div>
        {durum?.hata && <p className="crit-note" role="alert" style={{ margin: 0 }}>{durum.hata}</p>}
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>Saatler Türkiye saatiyle.</span>
          <button className="btn primary" type="submit" disabled={bekliyor}>{bekliyor ? "Kaydediliyor…" : id ? "Kaydet" : "Oluştur"}</button>
        </div>
      </form>
    </Modal>
  );
}

/** Sayfa başlığındaki "Etkinlik oluştur" (yetkili) */
export function EtkinlikOlustur({ varsayilan, turler }: { varsayilan: Form; turler: EtkinlikTuru[] }) {
  const [acik, setAcik] = useState(false);
  const kapat = useCallback(() => setAcik(false), []);
  return (
    <>
      <button type="button" className="btn primary" onClick={() => setAcik(true)}><Ikon ad="i-plus" />Etkinlik oluştur</button>
      {acik && <EtkinlikPenceresi deger={varsayilan} turler={turler} kapat={kapat} />}
    </>
  );
}

/** Etkinlik detayında düzenle ve sil (yetkili) */
export function EtkinlikIslemleri({ id, baslik, deger, turler, yoklamaSayisi }: { id: string; baslik: string; deger: Form; turler: EtkinlikTuru[]; yoklamaSayisi: number }) {
  const toast = useToast();
  const router = useRouter();
  const [pencere, setPencere] = useState<"duzenle" | "sil" | null>(null);
  const [siliniyor, gecis] = useTransition();
  const kapat = useCallback(() => setPencere(null), []);
  const sil = () => gecis(async () => {
    const r = await etkinlikSilAksiyonu(id);
    if (r.hata) { toast(r.hata); return; }
    toast(`${baslik} silindi`);
    setPencere(null);
    router.push("/etkinlikler", { scroll: false });
  });
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <button type="button" className="btn" onClick={() => setPencere("duzenle")}><Ikon ad="i-edit" />Düzenle</button>
        <button type="button" className="btn" onClick={() => setPencere("sil")}><Ikon ad="i-x" />Sil</button>
      </div>
      {pencere === "duzenle" && <EtkinlikPenceresi id={id} deger={deger} turler={turler} kapat={kapat} />}
      {pencere === "sil" && (
        <Modal acik kapat={kapat} baslik="Etkinliği sil" genislik={440}>
          <p style={{ marginTop: 0 }}><b>{baslik}</b> silinecek.{yoklamaSayisi > 0 && ` ${yoklamaSayisi} yoklama kaydı da silinir ve katılım oranları değişir.`} Bu geri alınamaz.</p>
          <div className="row" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn" onClick={kapat}>Vazgeç</button>
            <button type="button" className="btn primary" onClick={sil} disabled={siliniyor}>{siliniyor ? "Siliniyor…" : "Sil"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
