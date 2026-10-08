"use client";
import { useState } from "react";
import type { Taraf } from "@/lib/types";
import { DERECE, EsyaIkonu } from "@/components/oyun/EsyaIkonu";
import { Ikon } from "@/components/ui/Ikon";
import { Modal } from "@/components/ui/Modal";
import { type Taslak, ZIRH_YUVALARI, siniflarMetni, seciciEsyalari, seciciSetleri, setLevel, setOf, tamSetBonusu } from "@/lib/oyun/build";
import { sinifAdi } from "@/lib/etiketler";
import { type Katalog, YUVA_ADLARI, YUVA_TURLERI, aralikMetni, bonusMetni, derecelerOf, esyaAdi, setBonusMetni } from "@/lib/oyun/katalog";


/** Yuva ya da set seçici: arama, "levelime uygun" filtresi, takılı olan işaretli */
export function EsyaSecici({ secim, t, kat, sahip, taraf, kapat, onTak, onSetTak, onBosalt }: {
  secim: number | "set";
  t: Taslak;
  kat: Katalog;
  sahip: string;
  taraf: Taraf;
  kapat: () => void;
  onTak: (yuva: number, esyaId: number) => void;
  onSetTak: (anahtar: string) => void;
  onBosalt: (yuvalar: number[]) => void;
}) {
  const [ara, setAra] = useState("");
  const [uygun, setUygun] = useState(true);
  const set = secim === "set";
  const liste = set ? null : seciciEsyalari(kat, t, secim, ara, uygun);
  const setler = set ? seciciSetleri(kat, t, ara, uygun) : null;
  const takili = set ? null : t.ekipman[String(secim)]?.itemId;
  const zirhYuvasi = !set && ZIRH_YUVALARI.includes(secim);

  return (
    <Modal acik kapat={kapat} baslik={`${set ? "Set" : YUVA_ADLARI[secim]} seç · ${sinifAdi(t.sinif, taraf)}`} genislik={720}>
      <label className="search" htmlFor="pk-q" style={{ maxWidth: "none" }}>
        <Ikon ad="i-search" />
        <input id="pk-q" type="search" placeholder={set ? "Set ya da parça ara" : "Eşya ara"} autoComplete="off" autoFocus value={ara} onChange={(e) => setAra(e.target.value)} />
      </label>
      <div className="pk-bar">
        <label className="check" htmlFor="pk-fit"><input type="checkbox" id="pk-fit" checked={uygun} onChange={(e) => setUygun(e.target.checked)} />Yalnızca levelime uygun olanlar</label>
        <span className="muted">{set ? `${setler!.length} set` : `${liste!.length} eşya`}</span>
      </div>
      <div className="pk-list" role="listbox" aria-label={set ? "Setler" : "Eşyalar"}>
        {set ? setler!.map((st) => {
          const lv = setLevel(kat, st), tam = tamSetBonusu(kat, t.sinif, st), ilk = kat.esyalar.get(st.parcalar[0]);
          const zirh = st.parcalar.map((id) => kat.esyalar.get(id)).find((e) => e?.yuvalar[0] === "zirh") ?? ilk;
          return (
            <button type="button" className="pk-item" role="option" aria-selected={false} key={st.anahtar} onClick={() => onSetTak(st.anahtar)}>
              <EsyaIkonu yuva="zirh" esya={zirh} />
              <span style={{ minWidth: 0 }}><b>{st.ad}</b><span className="meta">5 parça{lv ? ` · Lv ${lv}` : ""}{tam ? <> · <span style={{ color: "var(--good)" }}>{setBonusMetni(tam, 3)}</span></> : null}</span></span>
              <span className="grade" style={{ color: ilk ? DERECE[ilk.derece][1] : undefined }}>{st.aile ? "Bonuslu" : ilk ? DERECE[ilk.derece][0] : ""}</span>
            </button>
          );
        }) : liste!.slice(0, 250).map((e) => {
          const st = zirhYuvasi ? setOf(kat, e) : null, d = derecelerOf(kat, e);
          const satir = (
            <button type="button" className="pk-item" role="option" aria-selected={e.id === takili} key={e.id} onClick={() => onTak(secim as number, e.id)}>
              <EsyaIkonu yuva={YUVA_TURLERI[secim as number]} esya={e} />
              <span style={{ minWidth: 0 }}>
                <b>{esyaAdi(e, sahip)}</b>
                <span className="meta">{st ? `Set: ${st.ad}` : e.kategori} · {siniflarMetni(e.siniflar, taraf)} · {aralikMetni(kat, e)}{d.length && bonusMetni(d[0], 2) ? <> · <span style={{ color: "var(--good)" }}>{bonusMetni(d[0], 2)}</span></> : null}</span>
              </span>
              <span className="grade" style={{ color: DERECE[e.derece][1] }}>{DERECE[e.derece][0]}</span>
            </button>
          );
          return st ? (
            <div className="pk-row" key={e.id}>
              {satir}
              <button type="button" className="btn pk-set" title={`${st.ad} setinin 5 parçasını birlikte tak`} onClick={() => onSetTak(st.anahtar)}>Tüm set</button>
            </div>
          ) : satir;
        })}
        {(set ? !setler!.length : !liste!.length) && <div className="empty">{set ? "Bu sınıf ve levelde set yok." : "Bu yuvaya uygun eşya yok."} Filtreyi kapatmayı dene.</div>}
      </div>
      <div className="pk-foot">
        <button type="button" className="btn" onClick={() => onBosalt(set ? ZIRH_YUVALARI : [secim])}>{set ? "Zırh yuvalarını boşalt" : "Yuvayı boşalt"}</button>
        <span className="muted">Kaynak: KO Bugda · {kat.esyalar.size} eşya. Eşya görselleri oyuna aittir.</span>
      </div>
    </Modal>
  );
}
