"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import { SayiKutusu } from "@/components/karakter/SayiKutusu";
import { Ikon } from "@/components/ui/Ikon";
import { aradaki } from "@/lib/gorevler/exp";
import {
  type DurakDurumu, ONERI_BASLIGI, ONERI_SIRASI, aralikOf, barMetni, durakDurumu, durakPayi, expMetni, gorevFiltrele, ilerleme, npcOf, oneriOf, rotaKonumu,
} from "@/lib/gorevler/hesap";
import { ARALIKLAR, type Aralik, type AralikId, GOREVLER, type Gorev, KAYNAKLAR, KOBUGDA_GOREVLER } from "@/lib/gorevler/veri";
import type { Taraf } from "@/lib/types";
import { gorevSil, gorevYaz, yapilanlariOku, yapilanlaraAbone } from "./yapilanDeposu";

const sunucuda = () => "";
const DURUM_ADI: Record<DurakDurumu, string> = { gecti: "Geçtin", burada: "Buradasın", ileride: "", kilitli: "83 açılınca" };

export function Rota({ profilId, taraf, levelSiniri, level: karakterLeveli, acik: sunucuAcik }: {
  profilId: string;
  taraf: Taraf;
  levelSiniri: 80 | 83;
  /** Ana karakterin leveli; yoksa ya da sunucu açılmadıysa 1 */
  level: number;
  acik: boolean;
}) {
  const [level, setLevel] = useState(Math.min(karakterLeveli, levelSiniri));
  const [aciklar, setAciklar] = useState<ReadonlySet<AralikId>>(() => new Set([aralikOf(level).id]));
  const [ara, setAra] = useState("");
  const [yapilanlariGizle, setYapilanlariGizle] = useState(false);
  const ham = useSyncExternalStore(yapilanlaraAbone, () => yapilanlariOku(profilId), sunucuda);
  const yapilanlar = useMemo(() => new Set(ham ? (JSON.parse(ham) as string[]) : []), [ham]);

  const levelDegistir = (l: number) => {
    const yeni = Math.max(1, Math.min(levelSiniri, l));
    setLevel(yeni);
    setAciklar(new Set([aralikOf(yeni).id]));
  };
  const ac = (id: AralikId, kaydir = false) => {
    setAciklar((s) => new Set(s).add(id));
    if (kaydir) requestAnimationFrame(() => document.getElementById(`durak-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const degistir = (id: AralikId) => setAciklar((s) => {
    const y = new Set(s);
    if (y.has(id)) y.delete(id); else y.add(id);
    return y;
  });

  const aranan = ara.trim() !== "";
  const gorunen = gorevFiltrele(GOREVLER, { ara, yapilanlariGizle }, yapilanlar, taraf);
  const genel = ilerleme(GOREVLER, levelSiniri, yapilanlar);
  const kalan = aradaki(level, levelSiniri);
  const sonEtap = Math.round((aradaki(70, 80) / aradaki(1, 80)) * 100);
  const duraklar = ARALIKLAR.filter((a) => !aranan || gorunen.some((g) => g.aralik === a.id));
  const hedef = (
    <li className="durak hedef" key="hedef">
      <span className="durak-isaret" aria-hidden="true">{levelSiniri}</span>
      <div className="durak-hedef">
        <b>Hedef: {levelSiniri}</b>
        <span>{levelSiniri === 80 ? "Sınır şimdilik 80, 83 sonra açılacak. 80’e varınca alttaki görevleri teslim etme, 83’ü bekle." : "Rota bitti: 83’tesin."}</span>
      </div>
    </li>
  );

  return (
    <>
      <section className="panel rota-ozet" aria-label="Rota özeti">
        <div className="rota-ozet-ust">
          <div className="b-field"><span className="pf-label" style={{ marginTop: 0 }}>Levelin</span>
            <div className="stepper sm">
              <button type="button" aria-label="Level azalt" onClick={() => levelDegistir(level - 1)}>−</button>
              <SayiKutusu id="gq-lv" deger={level} enAz={1} uzunluk={2} etiket="Level" onYaz={(n, son) => {
                if (n === null || (!son && (n < 1 || n > levelSiniri))) return;
                levelDegistir(n);
              }} />
              <button type="button" aria-label="Level artır" onClick={() => levelDegistir(level + 1)}>+</button>
            </div>
          </div>
          <div className="rota-sayi">
            <span className="eyebrow">{levelSiniri}’e kalan</span>
            <b>{level >= levelSiniri ? "Vardın" : expMetni(kalan)}</b>
            {level < levelSiniri && <small>EXP</small>}
          </div>
          <div className="rota-sayi">
            <span className="eyebrow">Yaptığın görev</span>
            <b>{genel.yapilan}<small> / {genel.toplam}</small></b>
          </div>
        </div>
        <RotaCizgisi level={level} levelSiniri={levelSiniri} onSec={(id) => ac(id, true)} />
        <p className="rota-not">
          {sunucuAcik ? "" : "Açılışta herkes 1. levelden başlar; ileriyi görmek için level’ı değiştir. "}
          1→80 EXP’nin %{sonEtap}’i 70–80 arasında: 70’e kadar görevler yeter, sonrası parti, EXP Premium ve Border Defense War.
        </p>
      </section>

      <div className="toolbar rota-arac">
        <label className="search" htmlFor="gq-q"><Ikon ad="i-search" /><input id="gq-q" type="search" placeholder="Görev, NPC ya da mob ara" autoComplete="off" value={ara} onChange={(e) => setAra(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={yapilanlariGizle} onChange={(e) => setYapilanlariGizle(e.target.checked)} />Yaptıklarımı gizle</label>
        <button type="button" className="mini" onClick={() => setAciklar(aciklar.size === ARALIKLAR.length ? new Set([aralikOf(level).id]) : new Set(ARALIKLAR.map((a) => a.id)))}>
          {aciklar.size === ARALIKLAR.length ? "Yalnızca durağımı aç" : "Tüm durakları aç"}
        </button>
        <a className="mini" href={KOBUGDA_GOREVLER} target="_blank" rel="noopener" style={{ marginLeft: "auto" }}>Tüm görev listesi (KO Bugda) <Ikon ad="i-out" /></a>
      </div>

      {aranan && duraklar.length === 0 ? <p className="panel empty">Bu aramayla görev yok.</p> : (
        <ol className="rota" aria-label="Rota">
          {duraklar.flatMap((a) => {
            const durak = (
              <Durak key={a.id} a={a} durum={durakDurumu(a, level, levelSiniri)} acik={aranan || aciklar.has(a.id)} onDegistir={() => degistir(a.id)}
                gorevler={gorunen.filter((g) => g.aralik === a.id)} tumu={GOREVLER.filter((g) => g.aralik === a.id)}
                levelSiniri={levelSiniri} taraf={taraf} yapilanlar={yapilanlar} onYap={(id, v) => (v ? gorevYaz : gorevSil)(profilId, id)} />
            );
            if (aranan) return [durak];
            // Hedef sınırda: 80 iken 80–83 durağından önce, 83 iken sonda
            if (levelSiniri === 80 && a.id === "80-83") return [hedef, durak];
            if (levelSiniri === 83 && a.id === "80-83") return [durak, hedef];
            return [durak];
          })}
        </ol>
      )}
    </>
  );
}

/** Yatay rota: eşit aralıklı duraklar, altın dolgu oyuncunun leveline kadar; dilime tıklayınca durak açılır */
function RotaCizgisi({ level, levelSiniri, onSec }: { level: number; levelSiniri: 80 | 83; onSec: (id: AralikId) => void }) {
  const n = ARALIKLAR.length;
  const yer = rotaKonumu(level) * 100;
  const noktalar = [...ARALIKLAR.map((a) => a.levelMin), ARALIKLAR[n - 1].levelMax];
  const sinir = noktalar.indexOf(levelSiniri);
  return (
    <div className="rc" role="group" aria-label={`Rota: level ${level}, sınır ${levelSiniri}`}>
      <div className="rc-yol">
        {sinir < n && <span className="rc-kilit" style={{ left: `${(sinir / n) * 100}%` }} aria-hidden="true" />}
        <span className="rc-dolu" style={{ width: `${yer}%` }} />
        {noktalar.map((lv, i) => (
          <span key={lv} className={`rc-nokta ${lv <= level ? "gecti" : ""} ${i > sinir ? "kilitli" : ""} ${lv === levelSiniri ? "sinir" : ""}`} style={{ left: `${(i / n) * 100}%` }} aria-hidden="true">
            <em>{lv}</em>
          </span>
        ))}
        <span className="rc-sen" style={{ left: `${yer}%` }} aria-hidden="true"><b style={{ transform: `translateX(${yer < 8 ? 0 : yer > 92 ? -100 : -50}%)` }}>Sen · {level}</b></span>
        {ARALIKLAR.map((a, i) => (
          <button type="button" key={a.id} className="rc-dilim" style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }}
            aria-label={`${a.ad} durağına git`} title={`${a.ad} · ${a.bolge}`} onClick={() => onSec(a.id)} />
        ))}
      </div>
    </div>
  );
}

function Durak({ a, durum, acik, onDegistir, gorevler, tumu, levelSiniri, taraf, yapilanlar, onYap }: {
  a: Aralik;
  durum: DurakDurumu;
  acik: boolean;
  onDegistir: () => void;
  /** Aramaya ve "yaptıklarımı gizle"ye göre görünenler */
  gorevler: Gorev[];
  tumu: Gorev[];
  levelSiniri: 80 | 83;
  taraf: Taraf;
  yapilanlar: ReadonlySet<string>;
  onYap: (id: string, v: boolean) => void;
}) {
  const ilr = ilerleme(tumu, levelSiniri, yapilanlar);
  const pay = durakPayi(a);
  const oncelikli = tumu.filter((g) => oneriOf(g, levelSiniri) === "hemen" && g.exp).sort((x, y) => (y.exp ?? 0) - (x.exp ?? 0)).slice(0, 3);
  const gruplar = ONERI_SIRASI.map((o) => ({ o, liste: gorevler.filter((g) => oneriOf(g, levelSiniri) === o) })).filter((x) => x.liste.length);
  const govde = `durak-govde-${a.id}`;
  return (
    <li className={`durak ${durum} ${acik ? "acik" : ""}`} id={`durak-${a.id}`} data-durak={a.id}>
      <span className="durak-isaret" aria-hidden="true">
        {durum === "gecti" ? <Ikon ad="i-check" /> : durum === "kilitli" ? <Ikon ad="i-lock" /> : a.levelMin}
      </span>
      <div className="durak-kart">
        <button type="button" className="durak-bas" aria-expanded={acik} aria-controls={govde} onClick={onDegistir}>
          <span className="durak-lv">{a.ad}</span>
          <span className="durak-ad">
            <b>{a.bolge}</b>
            {!acik && durum !== "gecti" && oncelikli.length > 0 && <small>{oncelikli.map((g) => g.ad.split(" / ")[0]).join(" · ")}</small>}
          </span>
          <span className="durak-sag">
            {DURUM_ADI[durum] && <span className={`durak-durum ${durum}`}>{DURUM_ADI[durum]}</span>}
            <span className="durak-sayac" title={`${ilr.toplam} görevden ${ilr.yapilan} tanesini yaptın`}>{ilr.yapilan}/{ilr.toplam}</span>
            <Ikon ad="i-right" />
          </span>
        </button>
        {acik && (
          <div className="durak-govde" id={govde}>
            <p className="durak-taktik">{a.taktik}</p>
            {pay && (
              <div className="durak-pay" title={`Görevler ${expMetni(pay.gorevExp)}, ihtiyaç ${expMetni(pay.ihtiyac)} EXP`}>
                <span>Görevler bu aralığın EXP’sinin</span>
                <div className="meter"><i style={{ width: `${Math.min(100, pay.oran * 100)}%` }} /></div>
                <b>%{Math.round(pay.oran * 100)}</b>
                <span className="muted">{pay.ad !== a.ad ? `${pay.ad} birlikte` : pay.oran >= 1 ? "kasmaya gerek yok" : "kalanı kasma"}</span>
              </div>
            )}
            {gruplar.length === 0 && <p className="muted" style={{ margin: "12px 0 0", fontSize: 14 }}>Bu durakta gösterilecek görev kalmadı.</p>}
            {gruplar.map(({ o, liste }) => (
              <section key={o} className={`durak-grup ${o}`}>
                <h3>{ONERI_BASLIGI[o]}</h3>
                <ul className="rg-list">
                  {liste.map((g) => <GorevSatiri key={g.id} g={g} taraf={taraf} nedenGoster={o !== "hemen"} yapildi={yapilanlar.has(g.id)} onYap={(v) => onYap(g.id, v)} />)}
                </ul>
              </section>
            ))}
            <p className="durak-kasma"><b>Görevler bitince:</b> {a.kasma.join(" · ")}</p>
          </div>
        )}
      </div>
    </li>
  );
}

function GorevSatiri({ g, taraf, nedenGoster, yapildi, onYap }: { g: Gorev; taraf: Taraf; nedenGoster: boolean; yapildi: boolean; onYap: (v: boolean) => void }) {
  const [acik, setAcik] = useState(false);
  const etiketler = [
    g.zorunlu && <span key="z" className="rg-et altin">Gerekli</span>,
    g.parti === "zorunlu" && <span key="p" className="rg-et">Parti şart</span>,
    g.parti === "onerilir" && <span key="p" className="rg-et">Parti</span>,
    g.tekrar === "gunluk" && <span key="t" className="rg-et">Günlük</span>,
    g.tekrar === "tekrar" && <span key="t" className="rg-et">Tekrarlanır</span>,
    g.zincir && <span key="c" className="rg-et">Zincir</span>,
    g.yeniSunucu === "yok" && <span key="y" className="rg-et kirmizi">Yeni sunucuda yok</span>,
    g.yeniSunucu === "dogrula" && <span key="y" className="rg-et turuncu">Açılışta doğrula</span>,
    g.celiski && <span key="ç" className="rg-et turuncu">Kaynaklar çelişiyor</span>,
  ].filter(Boolean);
  const detay = `gorev-detay-${g.id}`;
  return (
    <li className={`rg ${yapildi ? "done" : ""}`} data-gorev={g.id}>
      <input type="checkbox" className="rg-cb" checked={yapildi} onChange={(e) => onYap(e.target.checked)} aria-label={`${g.ad}: yaptım`} />
      <div className="rg-ana">
        <button type="button" className="rg-bas" aria-expanded={acik} aria-controls={detay} onClick={() => setAcik(!acik)}>
          <span className="rg-ad">{g.ad}</span>
          <span className="rg-xp">{g.exp ? <>{expMetni(g.exp)}<small> EXP</small></> : g.expMetni ?? ""}</span>
        </button>
        <div className="rg-alt">
          <span>Lv {g.level} · {npcOf(g, taraf)}</span>
          {etiketler}
          {g.exp ? <span className="rg-bar" title={`${g.level}. level barına göre`}>{barMetni(g.exp, g.level)}</span> : null}
        </div>
        {nedenGoster && g.neden && <p className="rg-neden">{g.neden}</p>}
        {acik && (
          <dl className="rg-detay" id={detay}>
            <dt>Bölge</dt><dd>{g.bolge}</dd>
            {g.hedef && <><dt>Hedef</dt><dd>{g.hedef}</dd></>}
            {g.odul && <><dt>Ödül</dt><dd>{g.odul}</dd></>}
            {g.exp && g.expMetni && <><dt>EXP</dt><dd>{g.expMetni}</dd></>}
            {!nedenGoster && g.neden && <><dt>Neden</dt><dd>{g.neden}</dd></>}
            {g.celiski && <><dt>Çelişki</dt><dd>{g.celiski}</dd></>}
            <dt>Kaynak</dt>
            <dd>{g.kaynaklar.map((k, i) => <span key={k}>{i > 0 && ", "}<a href={KAYNAKLAR[k].url} target="_blank" rel="noopener">{KAYNAKLAR[k].baslik}</a></span>)}</dd>
          </dl>
        )}
      </div>
    </li>
  );
}
