"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EsyaIkonu } from "@/components/oyun/EsyaIkonu";
import { DurumPill, Meter, SinifEtiketi } from "@/components/ui/Durum";
import { Ikon } from "@/components/ui/Ikon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFormAksiyonu } from "@/components/ui/useFormAksiyonu";
import { type FormSonucu, karakterKaydetAksiyonu } from "@/lib/actions/uyeler";
import { DURUM_ADI, DURUMLAR, RUTBE_ADI, RUTBE_RENGI, RUTBELER, SINIF_KISA, SINIFLAR, sinifAdi } from "@/lib/etiketler";
import type { EkipmanOzeti } from "@/lib/oyun/ozet";
import type { KarakterDurum, Rutbe, Sinif, Taraf } from "@/lib/types";
import { EkipmanPenceresi } from "./EkipmanPenceresi";

export interface UyeSatiri {
  id: string;
  ad: string;
  tsNick: string | null;
  sinif: Sinif | null;
  rutbe: Rutbe;
  level: number | null;
  reb: number;
  durum: KarakterDurum;
  notlar: string | null;
  hesapVar: boolean;
  benim: boolean;
  hazirlik: { ad: string; durum: "tamam" | "yok" | "kilitli"; ipucu: string }[];
  katilim: { yuzde: number; gelen: number; toplam: number } | null;
  ekipman: { tur: "yok" } | { tur: "gizli" } | { tur: "var"; ozet: EkipmanOzeti; gizli: boolean; meta: string };
}

/** Türkçe küçük harf; İngilizce adlarda ı → i */
const kucuk = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i");

export function UyeTablosu({ satirlar, irk, acik, yetkili }: { satirlar: UyeSatiri[]; irk: Taraf; acik: boolean; yetkili: boolean }) {
  const [q, setQ] = useState("");
  const [sinif, setSinif] = useState<Sinif | "">("");
  const [rutbe, setRutbe] = useState<Rutbe | "">("");
  const [durum, setDurum] = useState<KarakterDurum | "">("");
  const [ekipman, setEkipman] = useState<UyeSatiri | null>(null);
  const [duzenlenen, setDuzenlenen] = useState<UyeSatiri | "yeni" | null>(null);

  const gorunen = useMemo(() => {
    const aranan = kucuk(q.trim());
    return satirlar
      .filter((m) => (!aranan || kucuk(m.ad).includes(aranan) || kucuk(m.tsNick ?? "").includes(aranan))
        && (!sinif || m.sinif === sinif) && (!rutbe || m.rutbe === rutbe)
        && (durum ? m.durum === durum : m.durum !== "ayrildi"))
      .sort((a, b) => RUTBELER.indexOf(a.rutbe) - RUTBELER.indexOf(b.rutbe)
        || ((b.level ?? 0) * 100 + b.reb) - ((a.level ?? 0) * 100 + a.reb) || a.ad.localeCompare(b.ad, "tr"));
  }, [satirlar, q, sinif, rutbe, durum]);

  return (
    <>
      <div className="toolbar">
        <label className="search" htmlFor="q">
          <Ikon ad="i-search" />
          <input id="q" type="search" placeholder="Nick veya TS adı ara" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Sınıf filtresi">
          {(["", ...SINIFLAR] as const).map((s) => (
            <button type="button" key={s || "tumu"} className="chip" aria-pressed={sinif === s} onClick={() => setSinif(s)}>
              {s && <i className={`c-${SINIF_KISA[s]}`} />}{s ? sinifAdi(s, irk) : "Tümü"}
            </button>
          ))}
        </div>
        <select className="sel" aria-label="Rütbe filtresi" value={rutbe} onChange={(e) => setRutbe(e.target.value as Rutbe | "")}>
          <option value="">Tüm rütbeler</option>
          {RUTBELER.map((r) => <option key={r} value={r}>{RUTBE_ADI[r]}</option>)}
        </select>
        <select className="sel" aria-label="Durum filtresi" value={durum} onChange={(e) => setDurum(e.target.value as KarakterDurum | "")}>
          <option value="">Tüm durumlar</option>
          {DURUMLAR.map((d) => <option key={d} value={d}>{DURUM_ADI[d]}</option>)}
        </select>
        {yetkili && <button type="button" className="btn primary" style={{ marginLeft: "auto" }} onClick={() => setDuzenlenen("yeni")}><Ikon ad="i-plus" />Üye ekle</button>}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nick</th><th>Sınıf</th><th>Rütbe</th>
              {acik ? <th>Level</th> : <th>Hazırlık</th>}
              <th>Ekipman</th><th>Katılım</th><th>Durum</th>
              {yetkili && <th><span className="muted">Düzenle</span></th>}
            </tr>
          </thead>
          <tbody>
            {gorunen.map((m) => (
              <tr key={m.id}>
                <td className="name">
                  <Link href={`/uyeler/${m.id}`} style={{ color: "inherit", textDecoration: "none" }}><b>{m.ad}</b></Link>
                  <span>{m.tsNick ? `TS: ${m.tsNick}` : m.hesapVar ? "TS nick yok" : "Hesabı yok"}</span>
                </td>
                <td><SinifEtiketi sinif={m.sinif} irk={irk} /></td>
                <td className="rk" style={{ color: RUTBE_RENGI[m.rutbe] }}>{RUTBE_ADI[m.rutbe]}</td>
                {acik ? (
                  <td className="num">{m.level ?? <span className="muted">—</span>}{m.reb > 0 && <span className="reb">+{m.reb}</span>}</td>
                ) : (
                  <td>
                    <div className="pips">
                      {m.hazirlik.map((h) => (
                        <span key={h.ad} className={`pip ${h.durum === "tamam" ? "on" : h.durum === "yok" ? "off" : ""}`} title={h.ipucu} aria-label={h.ipucu} tabIndex={0}>
                          <Ikon ad={h.durum === "kilitli" ? "i-lock" : h.durum === "tamam" ? "i-check" : "i-x"} />
                        </span>
                      ))}
                    </div>
                  </td>
                )}
                <td><EkipmanHucresi m={m} ac={() => setEkipman(m)} /></td>
                <td>
                  {m.katilim ? (
                    <div className="att" title={`${m.katilim.gelen} / ${m.katilim.toplam} etkinlik`}>
                      <Meter yuzde={m.katilim.yuzde} etiket={`%${m.katilim.yuzde}`} /><span className="num">%{m.katilim.yuzde}</span>
                    </div>
                  ) : <span className="muted">—</span>}
                </td>
                <td><DurumPill durum={m.durum} /></td>
                {yetkili && (
                  <td><button type="button" className="icon-btn" aria-label={`${m.ad} düzenle`} onClick={() => setDuzenlenen(m)}><Ikon ad="i-edit" /></button></td>
                )}
              </tr>
            ))}
            {!gorunen.length && <tr><td colSpan={9} className="empty">Bu filtrelerle eşleşen üye yok.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>{satirlar.filter((m) => m.durum !== "ayrildi").length} üyeden {gorunen.length} tanesi gösteriliyor</div>

      {ekipman?.ekipman.tur === "var" && (
        <EkipmanPenceresi ad={ekipman.ad} ozet={ekipman.ekipman.ozet} meta={ekipman.ekipman.meta} kapat={() => setEkipman(null)} />
      )}
      {duzenlenen && <KarakterFormu m={duzenlenen === "yeni" ? null : duzenlenen} irk={irk} kapat={() => setDuzenlenen(null)} />}
    </>
  );
}

function EkipmanHucresi({ m, ac }: { m: UyeSatiri; ac: () => void }) {
  if (m.ekipman.tur === "yok") return <span className="eq-none">{m.benim ? "Build kaydetmedin" : "—"}</span>;
  if (m.ekipman.tur === "gizli") return <span className="eq-none"><Ikon ad="i-lock" />Gizli</span>;
  const o = m.ekipman.ozet;
  return (
    <button type="button" className="eq-btn" onClick={ac} aria-label={`${m.ad}: ekipmanı gör`}>
      <EsyaIkonu yuva="silah" esya={o.silah} />
      <span><b>AP {o.ap}</b><small>{o.kisa}{m.ekipman.gizli ? " · gizli" : ""}</small></span>
    </button>
  );
}

function KarakterFormu({ m, irk, kapat }: { m: UyeSatiri | null; irk: Taraf; kapat: () => void }) {
  const toast = useToast();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<FormSonucu>>(karakterKaydetAksiyonu);
  const [level, setLevel] = useState(m?.level?.toString() ?? "");
  useEffect(() => {
    if (durum?.tamam) { toast(durum.tamam); kapat(); }
  }, [durum, toast, kapat]);
  return (
    <Modal acik kapat={kapat} baslik={m ? `${m.ad} · düzenle` : "Üye ekle"}>
      <form action={gonder.action} onSubmit={gonder.onSubmit} className="form" style={{ marginBottom: 0 }} noValidate>
        {m && <input type="hidden" name="id" value={m.id} />}
        <div><label htmlFor="f-ad">Nick</label><input type="text" id="f-ad" name="ad" defaultValue={m?.ad} maxLength={20} required autoComplete="off" /></div>
        {!m && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Hesabı olmayan bir karakter eklenir; sahibi aynı nick’le davet koduyla kayıt olunca hesabına bağlanır.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          <div><label htmlFor="f-sinif">Sınıf</label><select className="sel" id="f-sinif" name="sinif" defaultValue={m?.sinif ?? ""} style={{ width: "100%", marginTop: 6 }}>
            <option value="">Seçilmedi</option>{SINIFLAR.map((s) => <option key={s} value={s}>{sinifAdi(s, irk)}</option>)}</select></div>
          <div><label htmlFor="f-rutbe">Rütbe</label><select className="sel" id="f-rutbe" name="rutbe" defaultValue={m?.rutbe ?? "aday"} style={{ width: "100%", marginTop: 6 }}>
            {RUTBELER.map((r) => <option key={r} value={r}>{RUTBE_ADI[r]}</option>)}</select></div>
          <div><label htmlFor="f-durum">Durum</label><select className="sel" id="f-durum" name="durum" defaultValue={m?.durum ?? "aktif"} style={{ width: "100%", marginTop: 6 }}>
            {DURUMLAR.map((d) => <option key={d} value={d}>{DURUM_ADI[d]}</option>)}</select></div>
          <div><label htmlFor="f-level">Level</label><input type="text" inputMode="numeric" id="f-level" name="level" value={level} onChange={(e) => setLevel(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="Açılışta" /></div>
          <div><label htmlFor="f-reb">Reb</label><input type="text" inputMode="numeric" id="f-reb" name="reb" defaultValue={m?.reb || ""} disabled={level !== "83"} placeholder={level === "83" ? "0" : "83’te"} /></div>
        </div>
        <div><label htmlFor="f-not">Not (üye listesinde gösterilmez)</label><textarea id="f-not" name="notlar" defaultValue={m?.notlar ?? ""} maxLength={500} /></div>
        {durum?.hata && <p className="crit-note" role="alert" style={{ margin: 0 }}>{durum.hata}</p>}
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>{m && !m.hesapVar ? "Bu karakterin hesabı yok." : ""}</span>
          <button className="btn primary" type="submit" disabled={bekliyor}>{bekliyor ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </form>
    </Modal>
  );
}
