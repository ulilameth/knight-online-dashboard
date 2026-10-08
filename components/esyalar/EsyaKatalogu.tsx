"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { baslangicTaslagi, type PlanlayiciVerisi } from "@/components/karakter/Planlayici";
import { taslakYaz } from "@/components/karakter/taslakDeposu";
import { EsyaDetayi } from "@/components/oyun/EsyaDetayi";
import { DERECE, EsyaIkonu } from "@/components/oyun/EsyaIkonu";
import { useKatalog } from "@/components/oyun/useKatalog";
import { Ikon } from "@/components/ui/Ikon";
import { useToast } from "@/components/ui/Toast";
import { SINIFLAR, SINIF_KISA, sinifAdi } from "@/lib/etiketler";
import { ESYA_GRUPLARI, YUVA_TURU_ADI, esyaTak, grubuOf, katalogListesi, setLevel, setTak, sinifEsyaSayisi, tamSetBonusu } from "@/lib/oyun/build";
import { type Esya, type EsyaDerecesi, type Katalog, YUVA_ADLARI, aralikMetni, bonusMetni, derecelerOf, esyaAdi, gerekliLevel, setBonusMetni } from "@/lib/oyun/katalog";
import type { Sinif } from "@/lib/types";

export type KatalogVerisi = Pick<PlanlayiciVerisi, "profilId" | "kayitli" | "yeni" | "irklar" | "taraf" | "nick">;

const bos = () => () => {};
const DERECELER = Object.entries(DERECE) as [EsyaDerecesi, [string, string]][];

export function EsyaKatalogu(v: KatalogVerisi) {
  const tarayicida = useSyncExternalStore(bos, () => true, () => false);
  const { kat, hata } = useKatalog();
  if (!tarayicida || !kat) return <div className="panel empty">{hata ? "Eşya kataloğu yüklenemedi. Sayfayı yenile." : "Eşya kataloğu yükleniyor…"}</div>;
  return <KatalogIc v={v} kat={kat} />;
}

function KatalogIc({ v, kat }: { v: KatalogVerisi; kat: Katalog }) {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [buildSinifi] = useState(() => baslangicTaslagi(v).sinif);
  const [sinif, setSinif] = useState<Sinif>(buildSinifi);
  const [ara, setAra] = useState("");
  const [grup, setGrup] = useState("");
  const [derece, setDerece] = useState<EsyaDerecesi | "">("");
  const seciliId = Number(params.get("esya"));
  const secili = seciliId ? kat.esyalar.get(seciliId) : undefined;
  // Detay ?esya=<id> ile açılır (paylaşılabilir bağlantı); sunucuya gidilmez
  const ac = (id: number | null) => {
    const p = new URLSearchParams(params.toString());
    if (id) p.set("esya", String(id)); else p.delete("esya");
    const q = p.toString();
    window.history.replaceState(null, "", q ? `?${q}` : location.pathname);
  };

  /** Taslağa uygula ve Karakter tasarımına geç */
  const uygula = (f: (t: ReturnType<typeof baslangicTaslagi>) => ReturnType<typeof baslangicTaslagi> | string, mesaj: string) => {
    const r = f(baslangicTaslagi(v));
    if (typeof r === "string") { toast(r); return; }
    taslakYaz(v.profilId, r);
    toast(mesaj);
    router.push("/karakter");
  };

  const liste = katalogListesi(kat, sinif, ara, grup, derece);
  const lv = (e: Esya) => gerekliLevel(kat, e, derecelerOf(kat, e)[0]?.[0] ?? 0);
  const kart = (e: Esya) => (
    <button type="button" className="it-card" key={e.id} onClick={() => ac(e.id)}>
      <EsyaIkonu yuva={e.yuvalar[0]} esya={e} />
      <span style={{ minWidth: 0 }}>
        <b>{esyaAdi(e, v.nick)}</b><span className="meta">{e.kategori} · {aralikMetni(kat, e)}</span>
        {derecelerOf(kat, e).length > 0 && <span className="ft">{bonusMetni(derecelerOf(kat, e)[0], 2)}</span>}
        <span className="gr" style={{ color: DERECE[e.derece][1] }}>{DERECE[e.derece][0]}</span>
      </span>
    </button>
  );

  return (
    <>
      <div className="panel">
        <div className="cls-tabs" role="tablist" aria-label="Sınıf">
          {SINIFLAR.map((s) => (
            <button type="button" key={s} className="cls-tab" role="tab" aria-selected={sinif === s} onClick={() => setSinif(s)}>
              <i className={`c-${SINIF_KISA[s]}`} />{sinifAdi(s, v.taraf)}<span>{sinifEsyaSayisi(kat, s)}</span>
            </button>
          ))}
        </div>
        <div className="toolbar" style={{ margin: "14px 0 0" }}>
          <label className="search" htmlFor="ic-q"><Ikon ad="i-search" /><input id="ic-q" type="search" placeholder="Eşya ya da kategori ara" autoComplete="off" value={ara} onChange={(e) => setAra(e.target.value)} /></label>
          <div className="chips" role="group" aria-label="Yuva grubu">
            {[["", "Tümü"] as const, ...ESYA_GRUPLARI.map(([k, l]) => [k, l] as const)].map(([k, l]) => (
              <button type="button" key={k} className="chip" aria-pressed={grup === k} onClick={() => setGrup(k)}>{l}</button>
            ))}
          </div>
          <select className="sel" aria-label="Derece" value={derece} onChange={(e) => setDerece(e.target.value as EsyaDerecesi | "")}>
            <option value="">Tüm dereceler</option>
            {DERECELER.map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>
      <div id="ic-list" style={{ marginTop: 16 }}>
        {ESYA_GRUPLARI.map(([k, l, yuvalar]) => {
          const es = liste.filter((e) => grubuOf(e) === k).sort((a, b) => a.kategori.localeCompare(b.kategori) || lv(b) - lv(a) || a.ad.localeCompare(b.ad));
          if (!es.length) return null;
          if (k === "zirh") {
            // Zırhlar 5 parçalık setlere ait: set kartı olarak, parçaya tıklanınca detay
            const anahtarlar = new Set(es.map((e) => e.setAnahtari));
            const setler = [...kat.setler.values()].filter((st) => anahtarlar.has(st.anahtar))
              .sort((a, b) => Number(!!b.aile) - Number(!!a.aile) || setLevel(kat, b) - setLevel(kat, a) || a.ad.localeCompare(b.ad));
            return (
              <div className="ic-group" key={k}>
                <h2><b>{l}</b> · {setler.length} set</h2>
                <p className="muted" style={{ margin: "0 0 12px", fontSize: 14 }}>“Seti tak” beş parçayı (kask, zırh, pantolon, eldiven, bot) build’ine birlikte takar. Bonuslu setlerde takılı parça sayısına göre ek bonus gelir. Tek parça için parçanın ikonuna tıkla.</p>
                <div className="set-grid">
                  {setler.map((st) => {
                    const ilk = kat.esyalar.get(st.parcalar[0])!, tam = tamSetBonusu(kat, sinif, st), slv = setLevel(kat, st);
                    return (
                      <div className="set-card" key={st.anahtar}>
                        <div className="set-top">
                          <div><b>{st.ad}</b><span className="meta">{st.parcalar.length} parça{slv ? ` · Lv ${slv}` : ""} · <span style={{ color: DERECE[ilk.derece][1] }}>{DERECE[ilk.derece][0]}</span></span></div>
                          {st.aileAdi && <span className="tag official">{st.aileAdi} bonusu</span>}
                        </div>
                        <div className="set-parts">
                          {st.parcalar.map((id) => { const p = kat.esyalar.get(id)!; return <button type="button" className="set-part" key={id} title={p.ad} aria-label={p.ad} onClick={() => ac(id)}><EsyaIkonu yuva={p.yuvalar[0]} esya={p} /></button>; })}
                        </div>
                        {tam && <p className="set-bon">Tam set: {setBonusMetni(tam)}</p>}
                        <button type="button" className="btn primary" onClick={() => uygula((t) => { const r = setTak(t, kat, st.anahtar, sinifAdi(t.sinif, v.taraf)); return "hata" in r ? r.hata : r.t; }, `${st.ad} seti takıldı: kask, zırh, pantolon, eldiven, bot`)}>Seti tak</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return (
            <div className="ic-group" key={k}>
              <h2><b>{l}</b> · {es.length}</h2>
              {yuvalar.length === 1 ? <div className="items-grid">{es.map(kart)}</div> : (
                <div className="ic-subs">
                  {yuvalar.map((y) => {
                    const alt = es.filter((e) => e.yuvalar[0] === y);
                    return alt.length ? <div key={y}><h3 className="ic-sub">{YUVA_TURU_ADI[y]} · {alt.length}</h3><div className="items-grid">{alt.map(kart)}</div></div> : null;
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!liste.length && <div className="panel empty">Bu filtrelerle eşya yok.</div>}
      </div>
      {secili && (
        <EsyaDetayi e={secili} kat={kat} sinif={buildSinifi} taraf={v.taraf} sahip={v.nick} kapat={() => ac(null)} onAc={ac}
          onTak={(y) => uygula((t) => esyaTak(t, kat, y, secili.id), `${esyaAdi(secili, v.nick)} takıldı: ${YUVA_ADLARI[y]}`)}
          onSetTak={(anahtar) => uygula((t) => { const r = setTak(t, kat, anahtar, sinifAdi(t.sinif, v.taraf)); return "hata" in r ? r.hata : r.t; }, `${kat.setler.get(anahtar)!.ad} seti takıldı: kask, zırh, pantolon, eldiven, bot`)} />
      )}
    </>
  );
}
