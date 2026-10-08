"use client";
// Karakter tasarımının panelleri: yalnızca çizer, değişiklikleri Planlayici'ya bildirir.
import { EsyaIkonu, DERECE } from "@/components/oyun/EsyaIkonu";
import { type Taslak, yuvaUyarisi } from "@/lib/oyun/build";
import { DIRENCLER, type Ekler, type Kurallar, PARCA_ADI, SILAH_ADI, STATLAR, type hesapla, havuzlar, skillSiniri } from "@/lib/oyun/hesap";
import { BONUSLAR, EKIPMAN_BOLUMLERI, type Katalog, YUVA_ADLARI, YUVA_TURLERI, bonusMetni, derecelerOf, esyaAdi, ozetMetni, satir, setBonusMetni } from "@/lib/oyun/katalog";
import type { Irk, StatAdi } from "@/lib/types";
import { SayiKutusu } from "./SayiKutusu";

type Hesap = ReturnType<typeof hesapla>;

export function StatPaneli({ t, irk, h, k, onYaz, onAdim }: {
  t: Taslak; irk: Irk; h: Hesap; k: Kurallar;
  onYaz: (s: StatAdi, v: number | null, son: boolean) => void;
  onAdim: (s: StatAdi, d: number) => void;
}) {
  const P = havuzlar(t, k), G = h.G.s, S = h.G.setten;
  const w = (v: number) => (Math.max(0, Math.min(v, k.statSiniri)) / k.statSiniri) * 100;
  return (
    <div id="b-stats">
      {STATLAR.map(([s, ab, ad], j) => {
        const baz = irk.statlar[s], ek = t.statlar[s], kendi = baz + ek, esya = G[9 + j], set = S[9 + j], toplam = kendi + esya;
        return (
          <div className="b-row" key={s}>
            <div className="nm"><b>{ab}</b><span>{ad} · {baz}+{ek}{esya ? <> <span className="eq">{esya - set ? `+${esya - set} eşya ` : ""}{set ? `+${set} set ` : ""}= {toplam}</span></> : null}</span></div>
            <div className="b-meter" role="img" aria-label={`${ab}: başlangıç ${baz}, eklenen ${ek}, eşyadan ${esya}, toplam ${toplam}`}>
              <i className="base" style={{ width: `${w(baz)}%` }} /><i className="add" style={{ width: `${w(Math.min(ek, k.statSiniri - baz))}%` }} /><i className="item" style={{ width: `${w(Math.min(esya, k.statSiniri - kendi))}%` }} />
            </div>
            <div className="b-ctl">
              <button type="button" aria-label={`${ab} azalt`} disabled={!ek} onClick={() => onAdim(s, -1)}>−</button>
              <SayiKutusu id={`st-${s}`} deger={kendi} enAz={baz} uzunluk={3} asim={P.statKalan < 0} onYaz={(v, son) => onYaz(s, v, son)}
                etiket={`${ab}, başlangıç ${baz} ile ${k.statSiniri} arası yaz`} baslik={`Başlangıç ${baz} + dağıtılan ${ek}`} />
              <button type="button" aria-label={`${ab} artır`} disabled={!(P.statKalan > 0 && kendi < k.statSiniri)} onClick={() => onAdim(s, 1)}>+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SkillPaneli({ t, k, agaclar, onYaz, onAdim }: {
  t: Taslak; k: Kurallar; agaclar: readonly string[];
  onYaz: (i: number, v: number | null, son: boolean) => void;
  onAdim: (i: number, d: number) => void;
}) {
  const P = havuzlar(t, k), enCok = Math.max(1, ...t.skiller);
  return (
    <div id="b-skills">
      {agaclar.map((ad, i) => {
        const kilitli = i === 3 && t.level < k.masterLevel, sinir = skillSiniri(t.sinif, t.level, i, k), asim = t.skiller[i] > sinir;
        return (
          <div className={`b-row ${kilitli ? "locked" : ""}`} key={i}>
            <div className="nm"><b>{ad}</b><span>{i === 3 ? (kilitli ? `Level ${k.masterLevel}’ta açılır` : `Master · en fazla ${sinir}`) : `${i + 1}. ağaç · en fazla ${sinir}`}</span></div>
            <div className="meter" aria-hidden="true"><i style={{ width: `${(t.skiller[i] / enCok) * 100}%` }} /></div>
            <div className="b-ctl">
              <button type="button" aria-label={`${ad} azalt`} disabled={!t.skiller[i]} onClick={() => onAdim(i, -1)}>−</button>
              <SayiKutusu id={`sk-${i}`} deger={t.skiller[i]} uzunluk={2} asim={asim} devreDisi={kilitli && !t.skiller[i]} onYaz={(v, son) => onYaz(i, v, son)}
                etiket={`${ad} puanı, 0 ile ${sinir} arası yaz`} />
              <button type="button" aria-label={`${ad} artır`} disabled={!(P.skillKalan > 0 && t.skiller[i] < sinir)} onClick={() => onAdim(i, 1)}>+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STAT_SUTUNU: Partial<Record<StatAdi, number>> = { str: 9, dex: 11, int: 12 };

export function HesapPaneli({ t, h, kat, sinifAdi, onEkler }: { t: Taslak; h: Hesap; kat: Katalog; sinifAdi: string; onEkler: (e: Ekler) => void }) {
  const x = t.ekler, SK = h.apStati.toUpperCase(), G = h.G;
  const lv = t.level === 83 && t.reb ? `83+${t.reb}` : String(t.level);
  const esyaEki = (n: number) => (n ? <> <small>+{n} eşya{G.setler.some((s) => s.satir) ? " ve set" : ""}</small></> : null);
  const etkiler = YUVA_TURLERI.map((_, i) => { const g = t.ekipman[String(i)]; return g && kat.esyalar.get(g.itemId); }).filter((e) => e && e.etki);
  const eksikVeri = YUVA_TURLERI.map((_, i) => { const g = t.ekipman[String(i)]; return g && kat.esyalar.get(g.itemId); }).filter((e) => e && !derecelerOf(kat, e).length);
  const sayi = (v: string) => Math.max(0, Math.min(999, parseInt(v, 10) || 0));
  return (
    <div className="ap-grid">
      <div className="ap-out" aria-live="polite">
        <div className="calc-top">
          <div><div className="eyebrow">Saldırı gücü (AP)</div><div className="ap-val num" id="ap-val">{h.ap}</div></div>
          <div className="calc-mini">
            <div><span>Savunma</span><b className="num" id="cv-ac">{h.savunma}</b></div>
            <div><span>Can (HP)</span><b className="num" id="cv-hp">{h.can}</b></div>
            <div><span>Mana (MP)</span><b className="num" id="cv-mp">{h.mana}</b></div>
          </div>
        </div>
        <div className="ap-meta">{sinifAdi} · {SILAH_ADI[h.silah]}{h.hs === "PRIEST" ? (h.apStati === "int" ? " · INT Battle Priest" : " · STR Battle Priest") : ""} · Lv {lv} · katsayı {h.katsayi}</div>
        <dl className="ap-break">
          <dt>Silah AP</dt><dd>{h.silahAp ? <>{h.silahAp}{h.solAp ? <> <small>+ sol el {h.solAp} (yarısı)</small></> : null}</> : <small>Silah takılı değil</small>}</dd>
          <dt>Toplam {SK}</dt><dd>{h.stat}{esyaEki(G.s[STAT_SUTUNU[h.apStati] ?? 9])}{x.ekStat ? <> <small>+{x.ekStat} ek</small></> : null}</dd>
          <dt>Base AP</dt><dd>{h.bazAp ? <>+{h.bazAp} <small>({SK} 150 üstü)</small></> : <small>yok</small>}</dd>
          <dt>Takı ve zırhtan AP</dt><dd>{G.apSabit ? `+${G.apSabit}` : <small>yok</small>}</dd>
          <dt>AP bonusu</dt><dd>{h.yuzde ? <>+%{h.yuzde}{G.s[17] ? <> <small>eşya %{G.s[17]}</small></> : null}</> : <small>yok</small>}</dd>
        </dl>
        <div className="ap-tags">{x.wes && <span className="tag official">WES +5 AP</span>}{x.wolf && <span className="tag official">Wolf +%20</span>}</div>
        {eksikVeri.length > 0 && <p className="crit-note" style={{ margin: 0 }}>Bonus verisi olmayan eşya: {eksikVeri.map((e) => e!.ad).join(", ")}. Bu eşyaların katkısı hesaba girmedi.</p>}
      </div>
      <div className="stack" style={{ gap: 16 }}>
        <form className="ap-form" noValidate onSubmit={(e) => e.preventDefault()}>
          <div className="ap-f ap-checks" style={{ gridColumn: "1/-1", justifyContent: "flex-start" }}>
            <label className="check" htmlFor="ap-wes"><input type="checkbox" id="ap-wes" checked={x.wes} onChange={(e) => onEkler({ ...x, wes: e.target.checked })} />WES (+5 silah AP)</label>
            <label className="check" htmlFor="ap-wolf"><input type="checkbox" id="ap-wolf" checked={x.wolf} onChange={(e) => onEkler({ ...x, wolf: e.target.checked })} />Wolf (+%20)</label>
          </div>
          <div className="ap-f"><label htmlFor="ap-xst">Ek {SK} (scroll, buff)</label><input id="ap-xst" type="number" min={0} max={999} inputMode="numeric" placeholder="0" value={x.ekStat || ""} onChange={(e) => onEkler({ ...x, ekStat: sayi(e.target.value) })} /></div>
          <div className="ap-f"><label htmlFor="ap-xpc">Ek AP bonusu (%)</label><input id="ap-xpc" type="number" min={0} max={999} inputMode="numeric" placeholder="0" value={x.ekYuzde || ""} onChange={(e) => onEkler({ ...x, ekYuzde: sayi(e.target.value) })} /></div>
        </form>
        {G.setler.length > 0 && (
          <div>
            <h3 className="calc-h">Set bonusu <small>takılı parçalara göre</small></h3>
            <div className="set-lines">
              {G.setler.map((s, i) => (
                <div className="set-line" key={i}>
                  <b>{s.set?.ad ?? "Set"}</b> · {s.parca}/5 parça ({Object.entries(PARCA_ADI).filter(([bit]) => s.maske & Number(bit)).map(([, n]) => n).join(", ")})<br />
                  {s.satir ? <span style={{ color: "var(--good)" }}>{setBonusMetni(s.satir, 10)}</span> : <span className="muted">Bu kombinasyonda bonus yok</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <h3 className="calc-h">Eşya ve takılardan gelen <small>set bonusu dahil</small></h3>
          <div className="feat-list">
            {BONUSLAR.filter(([i]) => G.s[i]).map(([i, , ad, birim]) => <span className="feat" key={i}><b>+{G.s[i]}{birim ?? ""}</b>{ad}</span>)}
            {etkiler.map((e) => <span className="feat" key={e!.id} title={e!.ad}><b>Etki</b>{e!.etki}</span>)}
            {!BONUSLAR.some(([i]) => G.s[i]) && !etkiler.length && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{G.adet ? "Takılı eşyaların bu derecede bonusu yok." : "Eşya takınca bonuslar burada toplanır."}</p>}
          </div>
        </div>
        <div>
          <h3 className="calc-h">Direnç <small>INT 100 üstü + eşya</small></h3>
          <div className="res-grid">
            {DIRENCLER.map(([i, ad]) => (
              <div key={i}><span>{ad}</span><b className="num">{h.direncTabani + G.s[i]}</b>{G.s[i] ? <small>+{G.s[i]} {G.setten[i] ? "eşya/set" : "eşya"}</small> : null}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EkipmanPaneli({ t, h, kat, irk, sahip, onSec, onSetSec, onArti }: {
  t: Taslak; h: Hesap; kat: Katalog; irk: Irk; sahip: string;
  onSec: (yuva: number) => void; onSetSec: () => void; onArti: (yuva: number, arti: number) => void;
}) {
  const setNotu = h.G.setler.map((s) => `${s.set?.ad ?? "Set"} ${s.parca}/5${s.satir ? " · bonus aktif" : ""}`).join(" · ");
  const yuvaHtml = (i: number) => {
    const ad = YUVA_ADLARI[i], g = t.ekipman[String(i)], e = g && kat.esyalar.get(g.itemId);
    const dereceler = e ? derecelerOf(kat, e) : [];
    const u = yuvaUyarisi(kat, t, irk, i);
    const bilgi = e ? u.metin ?? [DERECE[e.derece][0], ozetMetni(kat, e, g.arti) || e.kategori, bonusMetni(satir(kat, e, g.arti), 2)].filter(Boolean).join(" · ") : "";
    return (
      <div className="gear-slot" key={i}>
        <button type="button" className="slot-btn" data-pick={i} aria-label={`${ad}: ${e ? esyaAdi(e, sahip) : "boş"}. Eşya seç`} onClick={() => onSec(i)}>
          <EsyaIkonu yuva={YUVA_TURLERI[i]} esya={e} />
          <span className="sl"><small>{ad}</small><b>{e ? esyaAdi(e, sahip) : "Seç"}</b>{e && <em className={u.kotu ? "bad" : ""}>{bilgi}</em>}</span>
        </button>
        <select aria-label={`${ad} derecesi`} disabled={dereceler.length < 2} value={e ? g.arti : ""} onChange={(ev) => onArti(i, Number(ev.target.value))}>
          {dereceler.length ? dereceler.map((r) => <option key={r[0]} value={r[0]}>+{r[0]}</option>) : <option value="">—</option>}
        </select>
      </div>
    );
  };
  return (
    <div id="b-gear">
      {EKIPMAN_BOLUMLERI.map(([baslik, alt, yuvalar]) => {
        const zirh = baslik === "Zırh seti";
        return (
          <div key={baslik}>
            <div className="gear-h">
              <h3 className="calc-h">{baslik} <small>{zirh && setNotu ? setNotu : alt}</small></h3>
              {zirh && <button type="button" className="btn" id="b-settak" onClick={onSetSec}>Set seç</button>}
            </div>
            <div className="gear">{yuvalar.map(yuvaHtml)}</div>
          </div>
        );
      })}
    </div>
  );
}
