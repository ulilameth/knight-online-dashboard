"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Ikon } from "@/components/ui/Ikon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFormAksiyonu } from "@/components/ui/useFormAksiyonu";
import { type IslemSonucu, duzenKaydetAksiyonu, duzenSilAksiyonu, haftayiOlusturAksiyonu } from "@/lib/actions/takvim";
import type { EtkinlikTuru, HaftalikDuzen as Duzen } from "@/lib/types";

/** Pazartesiden pazara (0 pazar) */
const GUN_SIRASI = [1, 2, 3, 4, 5, 6, 0];
const GUN_ADI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export function HaftalikDuzen({ duzen, turler, yetkili, acik }: { duzen: Duzen[]; turler: EtkinlikTuru[]; yetkili: boolean; acik: boolean }) {
  const toast = useToast();
  const [secili, setSecili] = useState<Duzen | "yeni" | null>(null);
  const [bekliyor, gecis] = useTransition();
  const kapat = useCallback(() => setSecili(null), []);
  const tur = (kod: string) => turler.find((t) => t.kod === kod);
  const satirlar = [...duzen].sort((a, b) => GUN_SIRASI.indexOf(a.gun) - GUN_SIRASI.indexOf(b.gun) || a.saat.localeCompare(b.saat));
  const olustur = (hangi: "bu" | "gelecek") => gecis(async () => {
    const r = await haftayiOlusturAksiyonu(hangi);
    toast(r?.hata ?? r?.tamam ?? "");
  });

  return (
    <>
      <div className="table-wrap">
        <table className="sched" style={{ minWidth: 0 }}>
          <thead><tr><th>Gün</th><th>Saat</th><th>Etkinlik</th>{yetkili && <th><span className="sr-only">Düzenle</span></th>}</tr></thead>
          <tbody>
            {satirlar.map((d) => (
              <tr key={d.id} style={d.aktif ? undefined : { opacity: 0.55 }}>
                <td>{GUN_ADI[d.gun]}</td>
                <td className="num">{d.saat}</td>
                <td>{d.baslik}{d.baslik !== tur(d.tur)?.ad && <span className="muted"> · {tur(d.tur)?.kisaAd}</span>}{!d.aktif && <span className="muted"> · kapalı</span>}</td>
                {yetkili && <td><button type="button" className="icon-btn" aria-label={`${GUN_ADI[d.gun]} ${d.saat} düzenle`} onClick={() => setSecili(d)}><Ikon ad="i-edit" /></button></td>}
              </tr>
            ))}
            {!satirlar.length && <tr><td colSpan={yetkili ? 4 : 3} className="empty">Haftalık düzen boş.</td></tr>}
          </tbody>
        </table>
      </div>
      {yetkili && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button type="button" className="btn" onClick={() => setSecili("yeni")}><Ikon ad="i-plus" />Ekle</button>
          <button type="button" className="btn" disabled={!acik || bekliyor || !duzen.some((d) => d.aktif)} onClick={() => olustur("bu")}>Bu haftayı oluştur</button>
          <button type="button" className="btn" disabled={!acik || bekliyor || !duzen.some((d) => d.aktif)} onClick={() => olustur("gelecek")}>Gelecek haftayı oluştur</button>
          <p className="muted" style={{ fontSize: 13, margin: 0, flexBasis: "100%" }}>
            {acik ? "Açık satırlardan o haftanın henüz başlamamış etkinlikleri takvime eklenir; zaten olanlar tekrar eklenmez."
              : "Sunucu açılınca haftanın etkinlikleri buradan takvime eklenir. Şimdilik düzeni hazırlayabilirsin."}
          </p>
        </div>
      )}
      {secili && <DuzenPenceresi d={secili === "yeni" ? null : secili} turler={turler} kapat={kapat} />}
    </>
  );
}

function DuzenPenceresi({ d, turler, kapat }: { d: Duzen | null; turler: EtkinlikTuru[]; kapat: () => void }) {
  const toast = useToast();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<IslemSonucu>>(duzenKaydetAksiyonu);
  const [siliniyor, gecis] = useTransition();
  useEffect(() => { if (durum?.tamam) { toast(durum.tamam); kapat(); } }, [durum, toast, kapat]);
  const sil = () => gecis(async () => {
    const r = await duzenSilAksiyonu(d!.id);
    toast(r?.hata ?? r?.tamam ?? "");
    if (!r?.hata) kapat();
  });
  return (
    <Modal acik kapat={kapat} baslik={d ? "Haftalık düzen · düzenle" : "Haftalık düzene ekle"}>
      <form action={gonder.action} onSubmit={gonder.onSubmit} className="form" style={{ marginBottom: 0 }} noValidate>
        {d && <input type="hidden" name="id" value={d.id} />}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          <div><label htmlFor="h-tur">Tür</label><select className="sel" id="h-tur" name="tur" defaultValue={d?.tur ?? "bdw"} style={{ width: "100%", marginTop: 6 }}>
            {turler.map((t) => <option key={t.kod} value={t.kod}>{t.ad}</option>)}</select></div>
          <div><label htmlFor="h-gun">Gün</label><select className="sel" id="h-gun" name="gun" defaultValue={d?.gun ?? 1} style={{ width: "100%", marginTop: 6 }}>
            {GUN_SIRASI.map((g) => <option key={g} value={g}>{GUN_ADI[g]}</option>)}</select></div>
          <div><label htmlFor="h-saat">Saat (TSİ)</label><input type="time" id="h-saat" name="saat" defaultValue={d?.saat ?? "21:00"} step={300} required /></div>
          <div><label htmlFor="h-sure">Süre (dk)</label><input type="number" id="h-sure" name="sure" defaultValue={d?.sureDk ?? 60} min={5} max={600} step={5} required /></div>
        </div>
        <div><label htmlFor="h-baslik">Başlık</label><input type="text" id="h-baslik" name="baslik" defaultValue={d?.baslik ?? ""} maxLength={120} required autoComplete="off" placeholder="Örn. Border Defence War" /></div>
        <label className="check" htmlFor="h-aktif" style={{ textTransform: "none", letterSpacing: 0, font: "400 14px var(--font-body)", color: "var(--fg)" }}>
          <input type="checkbox" id="h-aktif" name="aktif" defaultChecked={d?.aktif ?? true} />Açık (hafta oluştururken eklenir)
        </label>
        {durum?.hata && <p className="crit-note" role="alert" style={{ margin: 0 }}>{durum.hata}</p>}
        <div className="row">
          {d ? <button type="button" className="btn" onClick={sil} disabled={siliniyor}><Ikon ad="i-x" />{siliniyor ? "Siliniyor…" : "Sil"}</button> : <span />}
          <button className="btn primary" type="submit" disabled={bekliyor}>{bekliyor ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </form>
    </Modal>
  );
}
