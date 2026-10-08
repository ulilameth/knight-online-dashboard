"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Ikon } from "@/components/ui/Ikon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFormAksiyonu } from "@/components/ui/useFormAksiyonu";
import { type AyarSonucu, asamaAksiyonu, asamaSilAksiyonu, klanAksiyonu } from "@/lib/actions/ayarlar";
import type { AsamaFormu, KlanFormu } from "@/lib/ayarlar";

const etiketStili = { textTransform: "none", letterSpacing: 0, font: "400 14px var(--font-body)", color: "var(--fg)" } as const;
const ikili = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 } as const;

/** Klan adı, ırk, TS adresi, açılış ve level sınırı. Yönetici değiştirir, yetkili görür. */
export function KlanBilgisi({ deger, secenekler, yonetici }: { deger: KlanFormu; secenekler: string[]; yonetici: boolean }) {
  const toast = useToast();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<AyarSonucu>>(klanAksiyonu);
  useEffect(() => { if (durum?.tamam) toast(durum.tamam); }, [durum, toast]);
  return (
    <form action={gonder.action} onSubmit={gonder.onSubmit} className="form" style={{ marginBottom: 0 }} noValidate>
      <fieldset disabled={!yonetici} style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 10, minWidth: 0 }}>
        <div style={ikili}>
          <div><label htmlFor="k-ad">Klan adı</label><input type="text" id="k-ad" name="klanAdi" defaultValue={deger.klanAdi} maxLength={20} /></div>
          <div><label htmlFor="k-mono">Arma harfleri</label><input type="text" id="k-mono" name="monogram" defaultValue={deger.monogram} maxLength={3} /></div>
        </div>
        <div>
          <span className="pf-label" style={{ margin: "0 0 6px" }} id="k-irk">Irk</span>
          <div className="b-share" role="radiogroup" aria-labelledby="k-irk">
            <label className="check" style={etiketStili}><input type="radio" name="irk" value="karus" defaultChecked={deger.irk === "karus"} />Karus</label>
            <label className="check" style={etiketStili}><input type="radio" name="irk" value="el_morad" defaultChecked={deger.irk === "el_morad"} />El Morad</label>
          </div>
        </div>
        <div style={ikili}>
          <div><label htmlFor="k-sunucu">Oyun sunucusu</label><input type="text" id="k-sunucu" name="sunucuAdi" defaultValue={deger.sunucuAdi} maxLength={40} placeholder="Açılışta belli olur" /></div>
          <div><label htmlFor="k-ts">TeamSpeak adresi</label><input type="text" id="k-ts" name="tsAdres" defaultValue={deger.tsAdres} maxLength={100} /></div>
        </div>
        <div style={ikili}>
          <div><label htmlFor="k-gun">Sunucu açılışı (TSİ)</label><input type="date" id="k-gun" name="acilisGun" defaultValue={deger.acilisGun} /></div>
          <div><label htmlFor="k-saat">Saat</label><input type="time" id="k-saat" name="acilisSaat" defaultValue={deger.acilisSaat} step={300} /></div>
          <div>
            <label htmlFor="k-level">Level sınırı</label>
            <select className="sel" id="k-level" name="levelSiniri" defaultValue={deger.levelSiniri} style={{ width: "100%", marginTop: 6 }}>
              {secenekler.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Açılıştan önce üyeler level giremez; geri sayım ve ekranlar açılış anına göre değişir. Üyeler level sınırının üstünde level ya da reb kaydedemez.
        </p>
      </fieldset>
      {durum?.hata && <p className="crit-note" role="alert" style={{ margin: 0 }}>{durum.hata}</p>}
      {yonetici
        ? <div className="row"><span /><button className="btn primary" type="submit" disabled={bekliyor}>{bekliyor ? "Kaydediliyor…" : "Kaydet"}</button></div>
        : <p className="muted" style={{ fontSize: 13, margin: 0 }}><Ikon ad="i-lock" /> Bu alanları yalnızca yönetici değiştirir.</p>}
    </form>
  );
}

export interface AsamaSatiri {
  id: number;
  sira: number;
  baslik: string;
  tarih: string;
  aciklama: string | null;
  form: AsamaFormu;
}

/** Resmi açılış takvimi: tarihler kaynaklarda tutarsız olduğu için yönetici düzeltir */
export function AcilisTakvimi({ asamalar, yonetici }: { asamalar: AsamaSatiri[]; yonetici: boolean }) {
  const toast = useToast();
  const [pencere, setPencere] = useState<{ tur: "duzenle" | "sil"; a: AsamaSatiri | null } | null>(null);
  const [siliniyor, gecis] = useTransition();
  const kapat = useCallback(() => setPencere(null), []);
  const yeniForm: AsamaFormu = { sira: String(Math.max(0, ...asamalar.map((a) => a.sira)) + 1), baslik: "", baslangicGun: "", saat: "", sonGun: "", aciklama: "", kaynakUrl: "" };
  return (
    <>
      <ul className="list who-edits">
        {asamalar.map((a) => (
          <li key={a.id}>
            <span style={{ minWidth: 0 }}>
              <b>{a.baslik}</b>
              <span className="muted" style={{ display: "block", fontSize: 13 }}>{a.tarih} · sıra {a.sira}{a.aciklama ? ` · ${a.aciklama}` : ""}</span>
            </span>
            {yonetici && (
              <span style={{ display: "flex", gap: 6 }}>
                <button type="button" className="icon-btn" aria-label={`${a.baslik} düzenle`} onClick={() => setPencere({ tur: "duzenle", a })}><Ikon ad="i-edit" /></button>
                <button type="button" className="icon-btn" aria-label={`${a.baslik} sil`} onClick={() => setPencere({ tur: "sil", a })}><Ikon ad="i-x" /></button>
              </span>
            )}
          </li>
        ))}
        {!asamalar.length && <li className="empty">Aşama yok.</li>}
      </ul>
      {yonetici && <button type="button" className="btn" style={{ marginTop: 12 }} onClick={() => setPencere({ tur: "duzenle", a: null })}><Ikon ad="i-plus" />Aşama ekle</button>}
      {pencere?.tur === "duzenle" && <AsamaPenceresi a={pencere.a} deger={pencere.a?.form ?? yeniForm} kapat={kapat} />}
      {pencere?.tur === "sil" && pencere.a && (
        <Modal acik kapat={kapat} baslik="Aşamayı sil" genislik={440}>
          <p style={{ marginTop: 0 }}><b>{pencere.a.baslik}</b> takvimden ve genel bakıştan kalkacak.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn" onClick={kapat}>Vazgeç</button>
            <button type="button" className="btn primary" disabled={siliniyor} onClick={() => gecis(async () => {
              const r = await asamaSilAksiyonu(pencere.a!.id);
              toast(r?.hata ?? r?.tamam ?? "");
              if (!r?.hata) kapat();
            })}>{siliniyor ? "Siliniyor…" : "Sil"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function AsamaPenceresi({ a, deger, kapat }: { a: AsamaSatiri | null; deger: AsamaFormu; kapat: () => void }) {
  const toast = useToast();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<AyarSonucu>>(asamaAksiyonu);
  useEffect(() => { if (durum?.tamam) { toast(durum.tamam); kapat(); } }, [durum, toast, kapat]);
  return (
    <Modal acik kapat={kapat} baslik={a ? "Aşamayı düzenle" : "Aşama ekle"}>
      <form action={gonder.action} onSubmit={gonder.onSubmit} className="form" style={{ marginBottom: 0 }} noValidate>
        {a && <input type="hidden" name="id" value={a.id} />}
        <div style={{ display: "grid", gridTemplateColumns: "80px minmax(0,1fr)", gap: 10 }}>
          <div><label htmlFor="a-sira">Sıra</label><input type="number" id="a-sira" name="sira" defaultValue={deger.sira} min={1} max={99} /></div>
          <div><label htmlFor="a-baslik">Başlık</label><input type="text" id="a-baslik" name="baslik" defaultValue={deger.baslik} maxLength={80} placeholder="Örn. 2. Ön kayıt ve sunucu seçimi" /></div>
        </div>
        <div style={ikili}>
          <div><label htmlFor="a-bas">Başlangıç günü</label><input type="date" id="a-bas" name="baslangicGun" defaultValue={deger.baslangicGun} /></div>
          <div><label htmlFor="a-saat">Saat (duyurulduysa)</label><input type="time" id="a-saat" name="saat" defaultValue={deger.saat} step={300} /></div>
          <div><label htmlFor="a-son">Son gün (dahil)</label><input type="date" id="a-son" name="sonGun" defaultValue={deger.sonGun} /></div>
        </div>
        <div><label htmlFor="a-aciklama">Açıklama</label><textarea id="a-aciklama" name="aciklama" defaultValue={deger.aciklama} maxLength={300} /></div>
        <div><label htmlFor="a-url">Kaynak bağlantısı</label><input type="text" id="a-url" name="kaynakUrl" defaultValue={deger.kaynakUrl} placeholder="https://www.nttgame.com/…" /></div>
        {durum?.hata && <p className="crit-note" role="alert" style={{ margin: 0 }}>{durum.hata}</p>}
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>Saat yoksa yalnızca gün gösterilir.</span>
          <button className="btn primary" type="submit" disabled={bekliyor}>{bekliyor ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </form>
    </Modal>
  );
}
