"use client";
import { useEffect, useState } from "react";
import { Ikon } from "@/components/ui/Ikon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFormAksiyonu } from "@/components/ui/useFormAksiyonu";
import { type FormSonucu, profilAksiyonu, sifreAksiyonu } from "@/lib/actions/profil";
import { SINIF_KISA, SINIFLAR, sinifAdi } from "@/lib/etiketler";
import type { Gorunurluk, Sinif, Taraf } from "@/lib/types";

export interface ProfilBilgisi {
  nick: string;
  tsNick: string;
  sinif: Sinif | null;
  level: number | null;
  reb: number;
  ekipmanGorunur: Gorunurluk;
  tsAdres: string;
  irk: Taraf;
  acik: boolean;
  acilisMetni: string;
  levelSiniri: number;
  rebSiniri: number;
  sonGuncelleme: string | null;
}

export function ProfilFormu({ p }: { p: ProfilBilgisi }) {
  const toast = useToast();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<FormSonucu>>(profilAksiyonu);
  const [sinif, setSinif] = useState<Sinif | null>(p.sinif);
  const [level, setLevel] = useState(p.level ?? 1);
  const [reb, setReb] = useState(p.reb);
  const [sifre, setSifre] = useState(false);
  useEffect(() => { if (durum?.tamam) toast(durum.tamam); }, [durum, toast]);
  const sinirla = (n: number) => Math.max(1, Math.min(p.levelSiniri, Number.isFinite(n) ? n : 1));
  const rebAcik = p.acik && level === 83 && p.rebSiniri > 0;
  const lv = (n: number) => { const yeni = sinirla(n); setLevel(yeni); if (yeni !== 83) setReb(0); };

  return (
    <>
      <form action={gonder.action} onSubmit={gonder.onSubmit} noValidate>
        <label className="pf-label" htmlFor="pf-nick">Nick</label>
        <div className="nick-field">
          <input id="pf-nick" type="text" readOnly value={p.nick} aria-describedby="pf-nick-hint" />
          <Ikon ad="i-lock" />
        </div>
        <p className="muted" id="pf-nick-hint" style={{ fontSize: 13, margin: "8px 0 0" }}>Nick’ini yetkililer değiştirir. Oyunda farklı bir nick aldıysan bir yetkiliye yaz.</p>

        <label className="pf-label" htmlFor="pf-ts">TeamSpeak nick</label>
        <input id="pf-ts" name="tsNick" className="pf-input" type="text" autoComplete="off" maxLength={30} defaultValue={p.tsNick} />
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>TeamSpeak’te ({p.tsAdres}) görünen adın; yetkililer seni TS’te bununla tanır.</p>

        <div className="pf-label" id="pf-cls-label">Sınıf</div>
        <input type="hidden" name="sinif" value={sinif ?? ""} />
        <div className="pf-classes" role="radiogroup" aria-labelledby="pf-cls-label">
          {SINIFLAR.map((s) => (
            <button type="button" key={s} className="pf-cls" role="radio" aria-checked={sinif === s} onClick={() => setSinif(s)}>
              <i className={`c-${SINIF_KISA[s]}`} />{sinifAdi(s, p.irk)}
            </button>
          ))}
        </div>

        <label className="pf-label" htmlFor="pf-level">Level</label>
        <div className="stepper">
          <button type="button" aria-label="Level azalt" disabled={!p.acik} onClick={() => lv(level - 1)}>−</button>
          <input id="pf-level" type="number" inputMode="numeric" min={1} max={p.levelSiniri} disabled={!p.acik}
            value={p.acik ? level : ""} placeholder={p.acik ? "" : "Açılışta"} onChange={(e) => lv(parseInt(e.target.value, 10))} />
          <button type="button" aria-label="Level artır" disabled={!p.acik} onClick={() => lv(level + 1)}>+</button>
        </div>
        {p.acik && <input type="hidden" name="level" value={level} />}

        <label className="pf-label" htmlFor="pf-reb">Reb (Rebirth)</label>
        <div className="stepper">
          <button type="button" aria-label="Reb azalt" disabled={!rebAcik} onClick={() => setReb(Math.max(0, reb - 1))}>−</button>
          <input id="pf-reb" type="number" inputMode="numeric" min={0} max={p.rebSiniri} disabled={!rebAcik}
            value={rebAcik ? reb : ""} placeholder={rebAcik ? "" : "83’te"} onChange={(e) => setReb(Math.max(0, Math.min(p.rebSiniri, parseInt(e.target.value, 10) || 0)))} />
          <button type="button" aria-label="Reb artır" disabled={!rebAcik} onClick={() => setReb(Math.min(p.rebSiniri, reb + 1))}>+</button>
        </div>
        {rebAcik && <input type="hidden" name="reb" value={reb} />}
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
          {!p.acik ? `Level sunucu açılınca (${p.acilisMetni}) girilir. Şimdilik planladığın sınıfı seç.`
            : `Level sınırı ${p.levelSiniri}${p.rebSiniri ? `, reb sınırı ${p.rebSiniri} (83+${p.rebSiniri})` : ""}; yönetici belirler.`}
        </p>

        <div className="pf-label" id="pf-show-label">Ekipmanım üye listesinde</div>
        <div className="b-share" role="radiogroup" aria-labelledby="pf-show-label">
          <label className="check" htmlFor="pf-show-k"><input type="radio" name="ekipmanGorunur" id="pf-show-k" value="klan" defaultChecked={p.ekipmanGorunur === "klan"} />Klana göster</label>
          <label className="check" htmlFor="pf-show-g"><input type="radio" name="ekipmanGorunur" id="pf-show-g" value="gizli" defaultChecked={p.ekipmanGorunur === "gizli"} />Gizli</label>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>Karakter tasarımında kaydettiğin build’in eşyaları ve statları. Gizli seçersen yalnızca sen görürsün.</p>

        {durum?.hata && <p className="crit-note" role="alert">{durum.hata}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 20 }}>
          <button className="btn primary" type="submit" style={{ minHeight: 44, paddingInline: 20 }} disabled={bekliyor}>{bekliyor ? "Kaydediliyor…" : "Kaydet"}</button>
          <button className="btn" type="button" style={{ minHeight: 44 }} onClick={() => setSifre(true)}>Şifremi değiştir</button>
          <span className="muted" style={{ fontSize: 13 }}>{p.sonGuncelleme ? `Son güncelleme: ${p.sonGuncelleme}` : ""}</span>
        </div>
      </form>
      {sifre && <SifrePenceresi kapat={() => setSifre(false)} />}
    </>
  );
}

function SifrePenceresi({ kapat }: { kapat: () => void }) {
  const toast = useToast();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<FormSonucu>>(sifreAksiyonu);
  useEffect(() => { if (durum?.tamam) { toast(durum.tamam); kapat(); } }, [durum, toast, kapat]);
  return (
    <Modal acik kapat={kapat} baslik="Şifremi değiştir">
      <form action={gonder.action} onSubmit={gonder.onSubmit} className="form" style={{ marginBottom: 0 }} noValidate>
        <div><label htmlFor="s-eski">Mevcut şifre</label><input type="password" id="s-eski" name="eski" autoComplete="current-password" required style={inputStili} /></div>
        <div><label htmlFor="s-yeni">Yeni şifre</label><input type="password" id="s-yeni" name="sifre" autoComplete="new-password" minLength={8} required style={inputStili} /></div>
        <div><label htmlFor="s-tekrar">Yeni şifre tekrar</label><input type="password" id="s-tekrar" name="sifreTekrar" autoComplete="new-password" required style={inputStili} /></div>
        {durum?.hata && <p className="crit-note" role="alert" style={{ margin: 0 }}>{durum.hata}</p>}
        <div className="row"><span className="muted" style={{ fontSize: 13 }}>En az 8 karakter.</span><button className="btn primary" type="submit" disabled={bekliyor}>{bekliyor ? "Değiştiriliyor…" : "Değiştir"}</button></div>
      </form>
    </Modal>
  );
}

const inputStili = { width: "100%", border: "1px solid var(--input-line)", borderRadius: 8, background: "var(--surface)", padding: "9px 10px", marginTop: 6 } as const;
