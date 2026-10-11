"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SayiKutusu } from "@/components/karakter/SayiKutusu";
import { Ikon } from "@/components/ui/Ikon";
import { aradaki } from "@/lib/gorevler/exp";
import {
  type DurakDurumu, ONERI_BASLIGI, aralikOf, barMetni, durakDurumu, durakPayi, expMetni, gorevAra, ilerleme, kisaAd, npcOf, oneriOf,
} from "@/lib/gorevler/hesap";
import { ARALIKLAR, type AralikId, GOREVLER, type Gorev, KAYNAKLAR, type Oneri } from "@/lib/gorevler/veri";
import type { Taraf } from "@/lib/types";
import { gorevSil, gorevYaz, yapilanlariOku, yapilanlaraAbone } from "./yapilanDeposu";

const sunucuda = () => "";
const DURUM_ADI: Record<DurakDurumu, string> = { gecti: "Geçtin", burada: "Buradasın", ileride: "", kilitli: "83’te açılır" };
/** Ana listenin altındaki katlanır gruplar: ad yanında kısa ipucu */
const IKINCIL: { o: Oneri; ipucu: string }[] = [
  { o: "istege", ipucu: "İstersen yap" }, { o: "ertele", ipucu: "Şimdi değil" }, { o: "sakla", ipucu: "Şimdi teslim etme" }, { o: "atla", ipucu: "Vakit kaybı" },
];

/**
 * Görevler: bir seferde tek durak. Üstte level ve rota (aralık düğmeleri), altında seçili durağın kartı:
 * taktik, önce yapılacaklar, katlanır diğer gruplar; yanında görev payı ve kasma yerleri.
 */
export function Rota({ profilId, taraf, levelSiniri, level: karakterLeveli, acik: sunucuAcik }: {
  profilId: string;
  taraf: Taraf;
  levelSiniri: 80 | 83;
  /** Ana karakterin leveli; yoksa ya da sunucu açılmadıysa 1 */
  level: number;
  acik: boolean;
}) {
  const [level, setLevel] = useState(Math.min(karakterLeveli, levelSiniri));
  const [secili, setSecili] = useState<AralikId | null>(null);
  const [ara, setAra] = useState("");
  const [detay, setDetay] = useState<string | null>(null);
  const ham = useSyncExternalStore(yapilanlaraAbone, () => yapilanlariOku(profilId), sunucuda);
  const yapilanlar = useMemo(() => new Set(ham ? (JSON.parse(ham) as string[]) : []), [ham]);

  const simdiki = aralikOf(level);
  const durakId = secili ?? simdiki.id;
  const i = ARALIKLAR.findIndex((a) => a.id === durakId);
  const durak = ARALIKLAR[i];
  const git = (id: AralikId, gorev: string | null = null) => { setSecili(id); setDetay(gorev); setAra(""); };
  const levelDegistir = (l: number) => {
    setLevel(Math.max(1, Math.min(levelSiniri, l)));
    setSecili(null);
    setDetay(null);
  };
  const yap = (id: string, v: boolean) => (v ? gorevYaz : gorevSil)(profilId, id);
  const sonuclar = ara.trim() ? gorevAra(GOREVLER, ara, taraf) : null;
  // Telefonda rota yatay kayar: seçili durak görünür kalsın (sayfa dikeyde kaymaz)
  const rota = useRef<HTMLElement>(null);
  useEffect(() => {
    const kap = rota.current;
    const dugme = kap?.querySelector<HTMLElement>(`[data-durak="${durakId}"]`);
    if (kap && dugme) kap.scrollLeft = dugme.offsetLeft - (kap.clientWidth - dugme.offsetWidth) / 2;
  }, [durakId]);

  return (
    <>
      <section className="panel gr-ust" aria-label="Levelin ve rota">
        <div className="gr-ust-satir">
          <div className="b-field"><label className="pf-label" htmlFor="gq-lv" style={{ marginTop: 0 }}>Levelin</label>
            <div className="stepper sm">
              <button type="button" aria-label="Level azalt" onClick={() => levelDegistir(level - 1)}>−</button>
              <SayiKutusu id="gq-lv" deger={level} enAz={1} uzunluk={2} etiket="Level" onYaz={(n, son) => {
                if (n === null || (!son && (n < 1 || n > levelSiniri))) return;
                levelDegistir(n);
              }} />
              <button type="button" aria-label="Level artır" onClick={() => levelDegistir(level + 1)}>+</button>
            </div>
          </div>
          <div className="gr-kalan">
            <span className="pf-label" style={{ margin: 0 }}>{levelSiniri}’e kalan</span>
            <b>{level >= levelSiniri ? "Vardın" : `${expMetni(aradaki(level, levelSiniri))} EXP`}</b>
          </div>
          <label className="search gr-ara" htmlFor="gq-q"><Ikon ad="i-search" /><input id="gq-q" type="search" placeholder="Görev ya da NPC ara" autoComplete="off" value={ara} onChange={(e) => setAra(e.target.value)} /></label>
        </div>

        <nav className="gr-rota" aria-label="Rota: level aralıkları" ref={rota}>
          <ol>
            {ARALIKLAR.map((a) => {
              const d = durakDurumu(a, level, levelSiniri);
              return (
                <li key={a.id} className={a.levelMin <= level ? "ulasildi" : undefined}>
                  <button type="button" className={`gr-durak ${d} ${a.id === durakId ? "secili" : ""}`} data-durak={a.id}
                    aria-current={a.id === durakId ? "step" : undefined} onClick={() => git(a.id)}>
                    <b>{a.ad}</b>
                    <span>{DURUM_ADI[d] || " "}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <p className="gr-not">
          {sunucuAcik ? "" : "Açılışta herkes 1. levelden başlar; ileriyi görmek için level’ı değiştir. "}
          {levelSiniri === 80 ? "Sınır şimdilik 80: 80–83 görevlerini 83 açılınca teslim et, 80’de verilen EXP’nin saklandığına dair kaynak yok." : "Sınır 83: 80–83 görevleri açık."}
        </p>
      </section>

      {sonuclar ? (
        <section className="panel" aria-label="Arama sonuçları">
          <h2 className="gr-h2">{sonuclar.length ? `${sonuclar.length} görev bulundu` : "Bu aramayla görev yok"}</h2>
          <ul className="gr-sonuc">
            {sonuclar.map((g) => (
              <li key={g.id}>
                <button type="button" className="btn" onClick={() => git(g.aralik, g.id)}>{ARALIKLAR.find((a) => a.id === g.aralik)?.ad}</button>
                <div><b>{kisaAd(g.ad).baslik}</b><span>Lv {g.level} · {npcOf(g, taraf)}</span></div>
                <span className="gr-exp">{g.exp ? `${expMetni(g.exp)} EXP` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <DurakKarti key={durak.id} durakIndeksi={i} durum={durakDurumu(durak, level, levelSiniri)} levelSiniri={levelSiniri} taraf={taraf}
          yapilanlar={yapilanlar} onYap={yap} detay={detay} onDetay={setDetay} onGit={git} />
      )}
    </>
  );
}

function DurakKarti({ durakIndeksi, durum, levelSiniri, taraf, yapilanlar, onYap, detay, onDetay, onGit }: {
  durakIndeksi: number;
  durum: DurakDurumu;
  levelSiniri: 80 | 83;
  taraf: Taraf;
  yapilanlar: ReadonlySet<string>;
  onYap: (id: string, v: boolean) => void;
  detay: string | null;
  onDetay: (id: string | null) => void;
  onGit: (id: AralikId) => void;
}) {
  const a = ARALIKLAR[durakIndeksi];
  const onceki = ARALIKLAR[durakIndeksi - 1];
  const sonraki = ARALIKLAR[durakIndeksi + 1];
  const gorevler = GOREVLER.filter((g) => g.aralik === a.id);
  const ana = gorevler.filter((g) => oneriOf(g, levelSiniri) === "hemen");
  const gruplar = IKINCIL.map((x) => ({ ...x, liste: gorevler.filter((g) => oneriOf(g, levelSiniri) === x.o) })).filter((x) => x.liste.length);
  // Ana liste boşsa (ör. sınır 80 iken 80–83) gruplar açık gelir
  const [aciklar, setAciklar] = useState<ReadonlySet<Oneri>>(() => new Set(ana.length ? [] : gruplar.map((x) => x.o)));
  const ilr = ilerleme(gorevler, levelSiniri, yapilanlar);
  const pay = durakPayi(a);
  const satir = (g: Gorev, nedenGoster: boolean) => (
    <GorevSatiri key={g.id} g={g} taraf={taraf} nedenGoster={nedenGoster} yapildi={yapilanlar.has(g.id)} onYap={(v) => onYap(g.id, v)}
      acik={detay === g.id} onAc={() => onDetay(detay === g.id ? null : g.id)} />
  );

  return (
    <section className={`gr-kart ${durum}`} aria-label={`${a.ad} durağı`} data-kart={a.id}>
      <header className="gr-kart-bas">
        <div className="gr-kart-ad">
          <span className="gr-aralik">{a.ad}</span>
          <h2>{a.bolge}</h2>
          {DURUM_ADI[durum] && <span className={`gr-durum ${durum}`}>{DURUM_ADI[durum]}</span>}
        </div>
        <div className="gr-ilerleme">
          <span>{ilr.yapilan} / {ilr.toplam} görev</span>
          <div className="meter" role="img" aria-label={`${ilr.toplam} görevden ${ilr.yapilan} tanesi yapıldı`}>
            <i style={{ width: `${ilr.toplam ? (ilr.yapilan / ilr.toplam) * 100 : 0}%` }} />
          </div>
        </div>
      </header>

      <div className="gr-kart-govde">
        <div className="gr-ana">
          <div className="gr-kutu gr-taktik">
            <h3 className="gr-baslik">Taktik</h3>
            <p>{a.taktik}</p>
          </div>
          {ana.length > 0 && (
            <>
              <h3 className="gr-baslik">{ONERI_BASLIGI.hemen}</h3>
              <ul className="gr-liste">{ana.map((g) => satir(g, false))}</ul>
            </>
          )}
          {gruplar.map(({ o, ipucu, liste }) => {
            const acik = aciklar.has(o);
            return (
              <div key={o} className="gr-grup" data-grup={o}>
                <button type="button" aria-expanded={acik} aria-controls={`gr-grup-${o}`} onClick={() => setAciklar((s) => {
                  const y = new Set(s);
                  if (acik) y.delete(o); else y.add(o);
                  return y;
                })}>
                  <span>{ONERI_BASLIGI[o]} <em>· {liste.length}</em></span>
                  <small>{ipucu}</small>
                  <Ikon ad="i-right" />
                </button>
                {acik && <ul className="gr-liste" id={`gr-grup-${o}`}>{liste.map((g) => satir(g, true))}</ul>}
              </div>
            );
          })}
        </div>

        <aside className="gr-yan" aria-label="Durak özeti">
          {pay && (
            <div className="gr-kutu">
              <h3 className="gr-baslik">Görevler yeter mi?</h3>
              <div className="gr-pay">
                <b>%{Math.round(pay.oran * 100)}</b>
                <div className="meter" role="img" aria-label={`Görevler bu aralığın EXP’sinin yüzde ${Math.round(pay.oran * 100)}’ini verir`}>
                  <i style={{ width: `${Math.min(100, pay.oran * 100)}%` }} />
                </div>
              </div>
              <p className="gr-kucuk">
                {pay.oran >= 1 ? "Görevler bu aralık için yeter: kasmaya gerek yok." : `Görevler bu aralığın EXP’sinin %${Math.round(pay.oran * 100)}’ini verir; kalanı kasarak.`}
                {pay.ad !== a.ad && ` (${pay.ad} birlikte)`}
              </p>
            </div>
          )}
          <div className="gr-kutu">
            <h3 className="gr-baslik">Görevler bitince kas</h3>
            <ul className="gr-kasma">{a.kasma.map((k) => <li key={k}>{k}</li>)}</ul>
          </div>
        </aside>
      </div>

      <footer className="gr-kart-alt">
        {onceki ? <button type="button" className="btn" onClick={() => onGit(onceki.id)}>← {onceki.ad}</button> : <span />}
        {sonraki && <button type="button" className="btn gr-sonraki" onClick={() => onGit(sonraki.id)}>Sonraki durak: {sonraki.ad} →</button>}
      </footer>
    </section>
  );
}

function GorevSatiri({ g, taraf, nedenGoster, yapildi, onYap, acik, onAc }: {
  g: Gorev;
  taraf: Taraf;
  /** İkincil gruplarda neden satırda görünür (asıl bilgi o); ana listede ayrıntıda */
  nedenGoster: boolean;
  yapildi: boolean;
  onYap: (v: boolean) => void;
  acik: boolean;
  onAc: () => void;
}) {
  const ad = kisaAd(g.ad);
  const etiketler = [g.zorunlu && "Gerekli", g.parti === "zorunlu" && "Parti şart", g.tekrar === "gunluk" && "Günlük", g.zincir && "Zincir"].filter(Boolean);
  const uyari = g.yeniSunucu === "yok" ? "Yeni sunucuda yok" : g.yeniSunucu === "dogrula" ? "Açılışta doğrula" : g.celiski ? "Kaynaklar çelişiyor" : "";
  const detayId = `gorev-detay-${g.id}`;
  return (
    <li className={`gr-gorev ${yapildi ? "bitti" : ""}`} data-gorev={g.id}>
      <span className="gr-cb"><input type="checkbox" checked={yapildi} onChange={(e) => onYap(e.target.checked)} aria-label={`${ad.baslik}: yaptım`} /></span>
      <div className="gr-gorev-ana">
        <button type="button" className="gr-gorev-ad" aria-expanded={acik} aria-controls={detayId} onClick={onAc}>
          <span>{ad.baslik}</span>
          {ad.ek > 0 && <em>+{ad.ek} görev</em>}
        </button>
        <div className="gr-gorev-alt">{[`Lv ${g.level}`, npcOf(g, taraf), ...etiketler].join(" · ")}</div>
        {nedenGoster && g.neden && <p className="gr-neden">{g.neden}</p>}
        {uyari && <div className="gr-uyari">{uyari}</div>}
        {acik && (
          <div className="gr-detay" id={detayId}>
            {ad.parcalar.length > 1 && <div><span>Görevler</span><span>{ad.parcalar.join(" · ")}</span></div>}
            <div><span>Bölge</span><span>{g.bolge}</span></div>
            {g.hedef && <div><span>Hedef</span><span>{g.hedef}</span></div>}
            {g.odul && <div><span>Ödül</span><span>{g.odul}</span></div>}
            {g.expMetni && <div><span>EXP</span><span>{g.expMetni}</span></div>}
            {!nedenGoster && g.neden && <div><span>Neden</span><span>{g.neden}</span></div>}
            {g.celiski && <div><span>Çelişki</span><span>{g.celiski}</span></div>}
            <div><span>Kaynak</span><span>{g.kaynaklar.map((k, j) => <span key={k}>{j > 0 && ", "}<a href={KAYNAKLAR[k].url} target="_blank" rel="noopener">{KAYNAKLAR[k].baslik}</a></span>)}</span></div>
          </div>
        )}
      </div>
      <div className="gr-exp">
        {g.exp ? <>{expMetni(g.exp)} EXP<small>{barMetni(g.exp, g.level)}</small></> : null}
      </div>
    </li>
  );
}
