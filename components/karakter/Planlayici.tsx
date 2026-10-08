"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useKatalog } from "@/components/oyun/useKatalog";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/Toast";
import { buildKaydetAksiyonu, sablonKaydetAksiyonu, sablonSilAksiyonu } from "@/lib/actions/karakter";
import type { Agaclar } from "@/lib/data/oyun";
import { SINIFLAR, sinifAdi } from "@/lib/etiketler";
import {
  LEVEL_EN_COK, REB_EN_COK, type Taslak, artiSec, bosTaslak, esyaTak, irklarOf, setTak, sinifDegistir, skillAdim, skillYaz, statAdim, statYaz,
  taslakAyni, taslakDuzelt, taslakHatasi, yuvaBosalt,
} from "@/lib/oyun/build";
import { type Kurallar, havuzlar, hesapla } from "@/lib/oyun/hesap";
import type { Katalog } from "@/lib/oyun/katalog";
import type { Gorunurluk, Irk, Sinif, Taraf } from "@/lib/types";
import { EsyaSecici } from "./EsyaSecici";
import { EkipmanPaneli, HesapPaneli, SkillPaneli, StatPaneli } from "./Paneller";
import { SayiKutusu } from "./SayiKutusu";
import { taslakOku, taslakYaz } from "./taslakDeposu";

export interface SablonOzeti {
  id: string;
  ad: string;
  taslak: Taslak;
}

export interface PlanlayiciVerisi {
  profilId: string;
  nick: string;
  taraf: Taraf;
  irklar: Irk[];
  agaclar: Agaclar;
  kurallar: Kurallar;
  dogrulanmamis: string[];
  /** Profildeki sınıf ve levelle boş taslak */
  yeni: Taslak;
  /** Kayıtlı build */
  kayitli: Taslak | null;
  kayitZamani: string | null;
  gorunur: Gorunurluk;
  yetkili: boolean;
  sablonlar: SablonOzeti[];
}

const bos = () => () => {};
/** Sunucuda false, tarayıcıda true (taslak localStorage'dan okunur; hidrasyon uyuşmazlığı olmasın) */
const useTarayicida = () => useSyncExternalStore(bos, () => true, () => false);

/** Eşyalar sayfası da aynı başlangıcı kullanır: tarayıcıdaki taslak, yoksa kayıtlı build, yoksa profilden boş */
export const baslangicTaslagi = (v: Pick<PlanlayiciVerisi, "profilId" | "kayitli" | "yeni" | "irklar" | "taraf">) =>
  taslakDuzelt(taslakOku(v.profilId) ?? v.kayitli ?? v.yeni, v.irklar, v.taraf);

export function Planlayici(v: PlanlayiciVerisi) {
  const tarayicida = useTarayicida();
  const { kat, hata } = useKatalog();
  if (!tarayicida || !kat) {
    return <div className="panel empty">{hata ? "Eşya kataloğu yüklenemedi. Sayfayı yenile." : "Karakter tasarımı yükleniyor…"}</div>;
  }
  return <PlanlayiciIc v={v} kat={kat} />;
}

function PlanlayiciIc({ v, kat }: { v: PlanlayiciVerisi; kat: Katalog }) {
  const toast = useToast();
  const { irklar, taraf, kurallar: k } = v;
  const [t, setT] = useState<Taslak>(() => baslangicTaslagi(v));
  const [secim, setSecim] = useState<number | "set" | null>(null);
  const [sablonAdi, setSablonAdi] = useState<string | null>(null);
  const [bekliyor, gecis] = useTransition();
  useEffect(() => { taslakYaz(v.profilId, t); }, [v.profilId, t]);

  const degistir = useCallback((x: Taslak) => setT(taslakDuzelt(x, irklar, taraf)), [irklar, taraf]);
  const uyar = (u?: string) => { if (u) toast(u); };
  const irk = irklarOf(irklar, t.sinif, taraf).find((r) => r.irkTuru === t.irkTuru) ?? irklar[0];
  const agaclar = v.agaclar[t.sinif];
  const h = useMemo(() => hesapla(t, irk.statlar, kat, t.ekler), [t, irk, kat]);
  const P = havuzlar(t, k);
  const hata = taslakHatasi(t, k, agaclar);
  const lv = t.level === 83 && t.reb ? `83+${t.reb}` : String(t.level);
  const sinifAd = sinifAdi(t.sinif, taraf);
  const kaydedilmemis = !v.kayitli || !taslakAyni(v.kayitli, t);
  const kapat = useCallback(() => setSecim(null), []);

  const kaydet = () => gecis(async () => {
    const r = await buildKaydetAksiyonu(t);
    toast(r.hata ?? r.tamam ?? "");
  });
  const sablonKaydet = (ad: string) => gecis(async () => {
    const r = await sablonKaydetAksiyonu(t, ad);
    toast(r.hata ?? r.tamam ?? "");
    if (!r.hata) setSablonAdi(null);
  });

  return (
    <div className="grid">
      <Panel className="s12">
        <div className="b-head">
          <div className="b-field"><label className="pf-label" htmlFor="b-cls" style={{ marginTop: 0 }}>Sınıf</label>
            <select className="sel" id="b-cls" value={t.sinif} onChange={(e) => degistir(sinifDegistir(t, e.target.value as Sinif))}>
              {SINIFLAR.map((s) => <option key={s} value={s}>{sinifAdi(s, taraf)}</option>)}
            </select></div>
          <div className="b-field"><label className="pf-label" htmlFor="b-race" style={{ marginTop: 0 }}>Irk</label>
            <select className="sel" id="b-race" value={t.irkTuru ?? ""} onChange={(e) => degistir({ ...t, irkTuru: e.target.value })}>
              {irklarOf(irklar, t.sinif, taraf).map((r) => <option key={r.irkTuru} value={r.irkTuru}>{r.ad}</option>)}
            </select></div>
          <div className="b-field"><span className="pf-label" style={{ marginTop: 0 }}>Level</span>
            <div className="stepper sm">
              <button type="button" aria-label="Level azalt" onClick={() => degistir({ ...t, level: Math.max(1, t.level - 1) })}>−</button>
              <SayiKutusu id="b-lv" deger={t.level} enAz={1} uzunluk={2} etiket="Level" onYaz={(n, son) => {
                if (n === null || (!son && (n < 1 || n > LEVEL_EN_COK))) return;
                degistir({ ...t, level: Math.max(1, Math.min(LEVEL_EN_COK, n)) });
              }} />
              <button type="button" aria-label="Level artır" onClick={() => degistir({ ...t, level: Math.min(LEVEL_EN_COK, t.level + 1) })}>+</button>
            </div></div>
          <div className="b-field"><span className="pf-label" style={{ marginTop: 0 }}>Reb</span>
            <div className="stepper sm">
              <button type="button" aria-label="Reb azalt" disabled={t.level !== LEVEL_EN_COK} onClick={() => degistir({ ...t, reb: Math.max(0, t.reb - 1) })}>−</button>
              <SayiKutusu id="b-reb" deger={t.reb} uzunluk={2} etiket="Reb" devreDisi={t.level !== LEVEL_EN_COK} placeholder="83’te" onYaz={(n, son) => {
                if (n === null || (!son && n > REB_EN_COK)) return;
                degistir({ ...t, reb: Math.min(REB_EN_COK, n) });
              }} />
              <button type="button" aria-label="Reb artır" disabled={t.level !== LEVEL_EN_COK} onClick={() => degistir({ ...t, reb: Math.min(REB_EN_COK, t.reb + 1) })}>+</button>
            </div></div>
          <div className="b-sum" id="b-sum">
            <div className={`b-pool ${P.statKalan < 0 ? "over" : ""}`}><b className="num">{P.statKalan}</b><span>Kalan stat · {P.statToplam}</span></div>
            <div className={`b-pool ${P.skillKalan < 0 ? "over" : ""}`}><b className="num">{P.skillKalan}</b><span>Kalan skill · {P.skillToplam}</span></div>
          </div>
        </div>
      </Panel>

      <Panel className="s6" baslik="Statlar" alt={`${irk.ad} · Level ${lv} · ${P.statKullanilan} puan dağıtıldı`}>
        <StatPaneli t={t} irk={irk} h={h} k={k}
          onYaz={(s, n, son) => { const r = statYaz(t, irk, s, n, son, k); if (r.t !== t) degistir(r.t); uyar(r.uyari); }}
          onAdim={(s, d) => degistir(statAdim(t, irk, s, d, k))} />
        <p className="muted" style={{ fontSize: 13, margin: "12px 0 0" }}>
          Gri kısım ırkın başlangıç statı, altın kısım senin dağıttığın puan, yeşil kısım takılı eşyaların bonusu. Karakter oluştururken {k.olusturmaBonus} bonus puan,
          level {k.masterLevel}’a kadar her level {k.statPerLevel}, sonra {k.statPerLevel60} puan gelir. Bir stat dağıtımda en fazla {k.statSiniri} olur; eşya bonusları bunun üstüne eklenir.
        </p>
      </Panel>
      <Panel className="s6" baslik="Skill ağaçları" alt={`${P.skillKullanilan} puan dağıtıldı`}>
        <SkillPaneli t={t} k={k} agaclar={agaclar}
          onYaz={(i, n, son) => { const r = skillYaz(t, i, n, son, k, agaclar[i]); if (r.t !== t) degistir(r.t); uyar(r.uyari); }}
          onAdim={(i, d) => degistir(skillAdim(t, i, d, k))} />
        <p className="muted" style={{ fontSize: 13, margin: "12px 0 0" }}>
          Skill puanı level {k.skillBaslangic}’da başlar, her level {k.skillPerLevel} puan (reb puan vermez). Bir ağaca levelinden fazla puan konamaz;
          master ağacına level {k.masterLevel}’tan sonra her level 1 puan, en fazla {k.masterMax}.
        </p>
      </Panel>

      <Panel className="s12" baslik="Saldırı, savunma ve can" alt="Stat, takılı eşya ve takılardan otomatik · formüller KO Bugda gelişmiş hesaplayıcıdan, oyun içi değerle doğrulanacak">
        <HesapPaneli t={t} h={h} kat={kat} sinifAdi={sinifAd} onEkler={(ekler) => degistir({ ...t, ekler })} />
      </Panel>

      <Panel className="s8" baslik="Ekipman" alt="Yuvaya tıkla, eşyayı seç, artı seviyesini belirle">
        <EkipmanPaneli t={t} h={h} kat={kat} irk={irk} sahip={v.nick} onSec={setSecim} onSetSec={() => setSecim("set")} onArti={(y, a) => degistir(artiSec(t, y, a))} />
      </Panel>
      <div className="s4 stack">
        <Panel baslik="Kaydet ve paylaş">
          <p className="b-vis">
            Üye listesinde: <b>{v.gorunur === "gizli" ? "Gizli" : "Klana açık"}</b> · <Link href="/profil">Profilden değiştir</Link><br />
            {v.kayitZamani ? `Son kayıt: ${v.kayitZamani}` : "Henüz kaydetmedin"}{v.kayitli && kaydedilmemis ? " · kaydedilmemiş değişiklik var" : ""}
          </p>
          {hata && <p className="crit-note" role="alert">{hata}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            <button type="button" className="btn primary" style={{ minHeight: 44, paddingInline: 18 }} disabled={!!hata || bekliyor || !kaydedilmemis} onClick={kaydet}>
              {bekliyor ? "Kaydediliyor…" : "Build’i kaydet"}
            </button>
            {v.yetkili && <button type="button" className="btn" style={{ minHeight: 44 }} disabled={!!hata} onClick={() => setSablonAdi(`${sinifAd} ${lv}`)}>Şablon yap</button>}
            {v.kayitli && kaydedilmemis && <button type="button" className="btn" style={{ minHeight: 44 }} onClick={() => { degistir(v.kayitli!); toast("Kayıtlı build’e dönüldü"); }}>Kayıtlıya dön</button>}
            <button type="button" className="btn" style={{ minHeight: 44 }} onClick={() => { degistir({ ...bosTaslak(t.sinif, t.level, t.reb, t.irkTuru) }); toast("Dağıtım ve ekipman sıfırlandı"); }}>Sıfırla</button>
          </div>
        </Panel>
        <Panel baslik="Klan şablonları" alt={v.sablonlar.length ? `${v.sablonlar.length} şablon` : undefined}>
          {v.sablonlar.length ? (
            <ul className="list who-edits">
              {[...v.sablonlar].sort((a, b) => Number(b.taslak.sinif === t.sinif) - Number(a.taslak.sinif === t.sinif)).map((s) => (
                <li key={s.id}>
                  <span style={{ minWidth: 0 }}><b>{s.ad}</b><span className="muted" style={{ display: "block", fontSize: 13 }}>{sinifAdi(s.taslak.sinif, taraf)} · Level {s.taslak.level === 83 && s.taslak.reb ? `83+${s.taslak.reb}` : s.taslak.level}</span></span>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button type="button" className="mini" onClick={() => { degistir(s.taslak); toast(`“${s.ad}” planına yüklendi; beğenirsen kaydet`); }}>Yükle</button>
                    {v.yetkili && <button type="button" className="mini" disabled={bekliyor} onClick={() => gecis(async () => { const r = await sablonSilAksiyonu(s.id); toast(r.hata ?? r.tamam ?? ""); })}>Sil</button>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>Yetkililer klanın önerdiği build’leri sınıfa göre buraya ekler; üyeler tek tıkla kendi planına yükler. Henüz şablon yok.</p>
          )}
        </Panel>
        <Panel baslik="Kural tablosu" alt="Yönetici günceller">
          <KuralTablosu k={k} dogrulanmamis={v.dogrulanmamis} irkSayisi={irklar.length} kat={kat} />
        </Panel>
      </div>

      {secim !== null && (
        <EsyaSecici secim={secim} t={t} kat={kat} sahip={v.nick} taraf={taraf} kapat={kapat}
          onTak={(y, id) => { degistir(esyaTak(t, kat, y, id)); setSecim(null); toast(`${kat.esyalar.get(id)!.ad.replace(/\{ad\}/g, v.nick)} takıldı`); }}
          onSetTak={(anahtar) => {
            const r = setTak(t, kat, anahtar, sinifAd);
            if ("hata" in r) { toast(r.hata); return; }
            degistir(r.t); setSecim(null); toast(`${kat.setler.get(anahtar)!.ad} seti takıldı: kask, zırh, pantolon, eldiven, bot`);
          }}
          onBosalt={(yuvalar) => { degistir(yuvaBosalt(t, yuvalar)); setSecim(null); }} />
      )}
      {sablonAdi !== null && (
        <Modal acik kapat={() => setSablonAdi(null)} baslik="Klan şablonu yap" genislik={440}>
          <form className="form" style={{ marginBottom: 0 }} onSubmit={(e) => { e.preventDefault(); sablonKaydet(sablonAdi); }}>
            <div><label htmlFor="sablon-ad">Şablon adı</label><input type="text" id="sablon-ad" maxLength={40} value={sablonAdi} onChange={(e) => setSablonAdi(e.target.value)} autoFocus /></div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>{sinifAd} üyeleri bu planı tek tıkla kendi taslağına yükleyebilir.</p>
            <div className="row"><span /><button type="submit" className="btn primary" disabled={bekliyor || !sablonAdi.trim()}>{bekliyor ? "Kaydediliyor…" : "Şablonu kaydet"}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function KuralTablosu({ k, dogrulanmamis, irkSayisi, kat }: { k: Kurallar; dogrulanmamis: string[]; irkSayisi: number; kat: Katalog }) {
  const d = (...anahtarlar: string[]) => !anahtarlar.some((a) => dogrulanmamis.includes(a));
  const satirlar: [string, string, boolean][] = [
    ["Level başına stat puanı", `${k.statPerLevel} · ${k.masterLevel}’tan sonra ${k.statPerLevel60}`, d("stat_per_level", "stat_per_level_60_ustu")],
    ["Reb başına bonus stat", `+${k.rebStat}`, d("reb_bonus_stat")],
    ["Tek stat sınırı", `${k.statSiniri} · reb dahil`, d("stat_cap")],
    ["Skill puanı başlangıcı", `Level ${k.skillBaslangic}`, d("skill_start_level")],
    ["Level başına skill puanı", `${k.skillPerLevel} · reb vermez`, d("skill_per_level")],
    ["Ağaç başına en fazla", `Level kadar · üst skill ${k.agacSiniri} (Warrior 3. ağaç ${k.warrior3Siniri})`, d("agac_siniri")],
    ["Master skill", `Level ${k.masterLevel} · level − ${k.masterLevel} puan, en fazla ${k.masterMax}`, d("master_level", "master_max")],
    ["Oluşturmada bonus stat", String(k.olusturmaBonus), d("olusturma_bonus_stat")],
    ["Irk başlangıç statları", `${irkSayisi} ırk`, true],
    ["AP, HP, MP, savunma formülü", "KO Bugda gelişmiş", false],
    ["Eşya verisi", `KO Bugda · ${kat.esyalar.size} eşya`, true],
    ["Set bonusları", kat.setKaynagi, true],
  ];
  return (
    <ul className="list rules" id="b-rules">
      {satirlar.map(([ad, deger, ok]) => <li key={ad}><span>{ad}</span><span className={`tag ${ok ? "official" : ""}`}>{deger}{ok ? "" : " · doğrulanacak"}</span></li>)}
    </ul>
  );
}

