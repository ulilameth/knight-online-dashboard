"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import { SayiKutusu } from "@/components/karakter/SayiKutusu";
import { Pill } from "@/components/ui/Durum";
import { Ikon } from "@/components/ui/Ikon";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { aradaki } from "@/lib/gorevler/exp";
import { ONERI_ADI, ONERI_SIRASI, ONERI_TURU, aralikOf, barMetni, expMetni, gorevFiltrele, ilerleme, karsilama, npcOf, oneriOf } from "@/lib/gorevler/hesap";
import { ARALIKLAR, type AralikId, GOREVLER, type Gorev, KAYNAKLAR, KOBUGDA_GOREVLER, type Oneri } from "@/lib/gorevler/veri";
import type { Taraf } from "@/lib/types";
import { gorevSil, gorevYaz, yapilanlariOku, yapilanlaraAbone } from "./yapilanDeposu";

const sunucuda = () => "";

export function GorevRehberi({ profilId, taraf, levelSiniri, level: karakterLeveli, acik }: {
  profilId: string;
  taraf: Taraf;
  levelSiniri: 80 | 83;
  /** Ana karakterin leveli; yoksa ya da sunucu açılmadıysa 1 */
  level: number;
  acik: boolean;
}) {
  const [level, setLevel] = useState(Math.min(karakterLeveli, levelSiniri));
  const [aralik, setAralik] = useState<AralikId | "">(aralikOf(level).id);
  const [oneri, setOneri] = useState<Oneri | "">("");
  const [ara, setAra] = useState("");
  const [yapilanlariGizle, setYapilanlariGizle] = useState(false);
  const ham = useSyncExternalStore(yapilanlaraAbone, () => yapilanlariOku(profilId), sunucuda);
  const yapilanlar = useMemo(() => new Set(ham ? (JSON.parse(ham) as string[]) : []), [ham]);

  const levelDegistir = (l: number) => {
    const yeni = Math.max(1, Math.min(levelSiniri, l));
    setLevel(yeni);
    setAralik(aralikOf(yeni).id);
  };

  const secili = ARALIKLAR.find((a) => a.id === aralik);
  const liste = gorevFiltrele(GOREVLER, { aralik, oneri, ara, yapilanlariGizle }, levelSiniri, yapilanlar, taraf);
  const aralikGorevleri = secili ? GOREVLER.filter((g) => g.aralik === secili.id) : GOREVLER;
  const ilr = ilerleme(aralikGorevleri, levelSiniri, yapilanlar);
  const pay = secili && karsilama().find((r) => r.a <= secili.levelMin && secili.levelMax <= r.b);
  const kalan = aradaki(level, levelSiniri);
  const gruplar = aralik ? [{ id: aralik, gorevler: liste }] : ARALIKLAR.map((a) => ({ id: a.id, gorevler: liste.filter((g) => g.aralik === a.id) })).filter((x) => x.gorevler.length);

  return (
    <>
      <Panel baslik="Senin rotan" alt={acik ? "Level’ını gir: aralığın, taktiği ve görevleri ona göre gelir" : "Açılışta herkes 1. levelden başlar; ileriyi planlamak için level’ı değiştir"}>
        <div className="gq-ust">
          <div className="b-field"><span className="pf-label" style={{ marginTop: 0 }}>Level</span>
            <div className="stepper sm">
              <button type="button" aria-label="Level azalt" onClick={() => levelDegistir(level - 1)}>−</button>
              <SayiKutusu id="gq-lv" deger={level} enAz={1} uzunluk={2} etiket="Level" onYaz={(n, son) => {
                if (n === null || (!son && (n < 1 || n > levelSiniri))) return;
                levelDegistir(n);
              }} />
              <button type="button" aria-label="Level artır" onClick={() => levelDegistir(level + 1)}>+</button>
            </div>
          </div>
          <div className="tiles gq-tiles">
            <div className="tile"><span className="eyebrow">Aralık</span><div className="v">{aralikOf(level).ad}</div><div className="s">{aralikOf(level).bolge}</div></div>
            <div className="tile"><span className="eyebrow">{levelSiniri}’e kalan</span><div className="v">{level >= levelSiniri ? "—" : expMetni(kalan)}</div><div className="s">{level >= levelSiniri ? "Sınırdasın" : `EXP · 1→${levelSiniri} toplamının %${Math.round((kalan / aradaki(1, levelSiniri)) * 100)}’i`}</div></div>
            <div className="tile"><span className="eyebrow">Görev payı</span><div className="v">{pay ? `%${Math.round(pay.oran * 100)}` : "—"}</div><div className="s">{!pay ? "Bir aralık seç" : pay.oran >= 1 ? `${pay.ad}: görevler yeter, mob kasmaya gerek yok` : `${pay.ad} ihtiyacının bu kadarını görevler verir`}</div></div>
            <div className="tile"><span className="eyebrow">Yaptığın</span><div className="v">{ilr.yapilan}<small> / {ilr.toplam}</small></div><div className="s">{secili ? `${secili.ad} görevi` : "görev"} (“Atla” hariç)</div></div>
          </div>
        </div>
      </Panel>

      <Panel baslik="Görevler" alt={`${liste.length} görev`} sag={<a className="btn" href={KOBUGDA_GOREVLER} target="_blank" rel="noopener">Tüm görev listesi (KO Bugda) <Ikon ad="i-out" /></a>}>
        <div className="chips" role="group" aria-label="Level aralığı" style={{ marginBottom: 12 }}>
          <button type="button" className="chip" aria-pressed={aralik === ""} onClick={() => setAralik("")}>Tümü</button>
          {ARALIKLAR.map((a) => (
            <button type="button" key={a.id} className="chip" aria-pressed={aralik === a.id} onClick={() => setAralik(a.id)}>{a.ad}</button>
          ))}
        </div>
        {secili && (
          <div className="gq-taktik">
            <p><b>Taktik ({secili.bolge}).</b> {secili.taktik}</p>
            <p><b>Görevler bitince kasma:</b> {secili.kasma.join(" · ")}</p>
          </div>
        )}
        <div className="toolbar" style={{ margin: "14px 0" }}>
          <label className="search" htmlFor="gq-q"><Ikon ad="i-search" /><input id="gq-q" type="search" placeholder="Görev, NPC, mob ya da bölge ara" autoComplete="off" value={ara} onChange={(e) => setAra(e.target.value)} /></label>
          <div className="chips" role="group" aria-label="Öneri">
            <button type="button" className="chip" aria-pressed={oneri === ""} onClick={() => setOneri("")}>Hepsi</button>
            {ONERI_SIRASI.filter((o) => o !== "sakla" || levelSiniri === 80).map((o) => (
              <button type="button" key={o} className="chip" aria-pressed={oneri === o} onClick={() => setOneri(o)}>{ONERI_ADI[o]}</button>
            ))}
          </div>
          <label className="check"><input type="checkbox" checked={yapilanlariGizle} onChange={(e) => setYapilanlariGizle(e.target.checked)} />Yaptıklarımı gizle</label>
        </div>
        {gruplar.length === 0 && <p className="empty">Bu filtreyle görev yok.</p>}
        {gruplar.map((gr) => (
          <section key={gr.id} aria-label={`${gr.id} görevleri`}>
            {!aralik && <h3 className="gq-grup">{ARALIKLAR.find((a) => a.id === gr.id)?.ad}</h3>}
            {gr.gorevler.length === 0 ? <p className="empty">Bu filtreyle görev yok.</p> : (
              <ul className="gq-list">
                {gr.gorevler.map((g) => (
                  <GorevSatiri key={g.id} g={g} taraf={taraf} oneri={oneriOf(g, levelSiniri)} yapildi={yapilanlar.has(g.id)}
                    onYap={(v) => (v ? gorevYaz : gorevSil)(profilId, g.id)} />
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="muted" style={{ fontSize: 13, margin: "14px 0 0" }}>İşaretler yalnızca bu tarayıcıda tutulur. Bar oranı görevin levelindeki EXP barına göre; EXP tablosu doğrulanmadı (aşağıda).</p>
      </Panel>
    </>
  );
}

function GorevSatiri({ g, taraf, oneri, yapildi, onYap }: { g: Gorev; taraf: Taraf; oneri: Oneri; yapildi: boolean; onYap: (v: boolean) => void }) {
  return (
    <li className={`gq ${yapildi ? "done" : ""}`} data-gorev={g.id}>
      <input type="checkbox" className="gq-cb" checked={yapildi} onChange={(e) => onYap(e.target.checked)} aria-label={`${g.ad}: yaptım`} />
      <div style={{ minWidth: 0 }}>
        <h3>{g.ad}</h3>
        <p className="meta">Lv {g.level} · {npcOf(g, taraf)} · {g.bolge}</p>
        <div className="gq-rozet">
          <Pill tur={ONERI_TURU[oneri]}>{ONERI_ADI[oneri]}</Pill>
          {g.zorunlu && <Tag resmi>Gerekli</Tag>}
          {g.zincir && <Tag>Zincir</Tag>}
          {g.tekrar === "gunluk" && <Tag>Günlük</Tag>}
          {g.tekrar === "tekrar" && <Tag>Tekrarlanır</Tag>}
          {g.parti === "zorunlu" && <Tag>Parti şart</Tag>}
          {g.parti === "onerilir" && <Tag>Parti önerilir</Tag>}
          {g.yeniSunucu === "yok" && <Pill tur="crit">Yeni sunucuda yok</Pill>}
          {g.yeniSunucu === "dogrula" && <Pill tur="warn">Açılışta doğrula</Pill>}
        </div>
        {(g.hedef || g.odul) && (
          <p className="info">
            {g.hedef && <><b>Hedef:</b> {g.hedef}</>}
            {g.hedef && g.odul && " · "}
            {g.odul && <><b>Ödül:</b> {g.odul}</>}
          </p>
        )}
        {g.neden && <p className="info neden">{g.neden}</p>}
        {g.celiski && <p className="gq-celiski"><b>Kaynaklar çelişiyor:</b> {g.celiski}</p>}
        <p className="gq-kaynak">Kaynak: {g.kaynaklar.map((k, i) => (
          <span key={k}>{i > 0 && ", "}<a href={KAYNAKLAR[k].url} target="_blank" rel="noopener">{KAYNAKLAR[k].baslik}</a></span>
        ))}</p>
      </div>
      <div className="xp">
        {g.exp ? <>{expMetni(g.exp)} <span className="muted">EXP</span><small title={`${g.level}. level barına göre`}>{barMetni(g.exp, g.level)}</small></> : g.expMetni && <span className="muted">{g.expMetni}</span>}
        {g.exp && g.expMetni && <small>{g.expMetni}</small>}
      </div>
    </li>
  );
}
