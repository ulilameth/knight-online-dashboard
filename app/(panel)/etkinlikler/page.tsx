import type { Metadata } from "next";
import Link from "next/link";
import { DetayaKaydir } from "@/components/etkinlikler/DetayaKaydir";
import { EtkinlikIslemleri, EtkinlikOlustur } from "@/components/etkinlikler/EtkinlikFormu";
import { YoklamaListesi } from "@/components/etkinlikler/YoklamaListesi";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { TurGrafigi } from "@/components/ortak/TurGrafigi";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { TarihKutusu } from "@/components/ui/TarihKutusu";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { SINIF_KISA, sinifAdi } from "@/lib/etiketler";
import { etkinlikGruplari, etkinliktenForm, isaretHaritasi, varsayilanEtkinlik, yoklamaAcik, yoklamaKadrosu } from "@/lib/etkinlik";
import { enIstikrarli, gecmisEtkinlikler, sayim, turKatilimi } from "@/lib/istatistik";
import { acildiMi, bicimle, goreliZaman, saatMetni, simdi, tsiGunu } from "@/lib/time";
import type { Etkinlik } from "@/lib/types";
import { yetkiYeterli } from "@/lib/types";

export const metadata: Metadata = { title: "Etkinlikler ve katılım" };

const GECMIS_ADET = 15;
const uzunTarih = (iso: string) => bicimle(iso, { day: "numeric", month: "long", weekday: "long" });

export default async function Etkinlikler({ searchParams }: { searchParams: Promise<{ e?: string; tum?: string }> }) {
  const { e: seciliId, tum } = await searchParams;
  const kullanici = await requireYetki("uye");
  const v = await veri();
  const [ayar, karakterler, etkinlikler, turler, yoklamalar] = await Promise.all([
    v.ayarlar.ayarlar(), v.uyeler.karakterler(), v.etkinlikler.etkinlikler(), v.etkinlikler.turler(), v.yoklamalar.yoklamalar(),
  ]);
  const su = simdi();
  const acik = acildiMi(ayar.acilisAt, su);
  const yetkili = yetkiYeterli(kullanici.profil.yetki, "yetkili");
  const tur = (kod: string) => turler.find((t) => t.kod === kod);

  const gruplar = etkinlikGruplari(etkinlikler, su);
  const secili = etkinlikler.find((e) => e.id === seciliId) ?? varsayilanEtkinlik(gruplar);
  const gecmisListe = tum ? gruplar.gecmis : gruplar.gecmis.slice(0, GECMIS_ADET);
  const gecmis = gecmisEtkinlikler(etkinlikler, turler, su);
  const ana = karakterler.filter((k) => k.anaKarakter && k.durum !== "ayrildi");
  const top5 = enIstikrarli(ana, gecmis.map((e) => e.id), yoklamalar);
  const savasSayisi = gecmis.filter((e) => e.tur !== "toplanti").length;

  const ogeHref = (e: Etkinlik) => `/etkinlikler?e=${encodeURIComponent(e.id)}${tum ? "&tum=1" : ""}`;
  const Oge = ({ e }: { e: Etkinlik }) => {
    const c = sayim(yoklamalar, e.id);
    const isaretli = c.katildi + c.gec + c.mazeretli + c.yok;
    return (
      <Link href={ogeHref(e)} scroll={false} className="ev-item" aria-current={e.id === secili?.id}>
        <TarihKutusu iso={e.baslangic} />
        <div style={{ minWidth: 0 }}>
          <h3>{e.baslik}</h3>
          <p>{bicimle(e.baslangic, { weekday: "short" })} {saatMetni(e.baslangic)} · {tur(e.tur)?.kisaAd ?? e.tur}</p>
        </div>
        <span className="cnt num">
          {yoklamaAcik(e, su) && isaretli
            ? <span title={`${c.katildi + c.gec} katıldı, ${yoklamaKadrosu(karakterler, yoklamalar, e.id).length} kişilik kadro`}>{c.katildi + c.gec}/{yoklamaKadrosu(karakterler, yoklamalar, e.id).length}</span>
            : <span className="muted" style={{ fontWeight: 500 }}>{goreliZaman(e.baslangic, su)}</span>}
        </span>
      </Link>
    );
  };

  const yeniForm = { tur: acik ? "bdw" : "toplanti", baslik: "", tarih: tsiGunu(su), saat: "21:00", sure: "60", aciklama: "" };

  return (
    <>
      <SayfaBasligi ust="Yoklama" baslik="Etkinlikler ve katılım" aciklama="Yetkililer etkinlik sırasında katılımı işaretler; üyeler kendi geçmişini görür."
        sag={yetkili && <EtkinlikOlustur varsayilan={yeniForm} turler={turler} />} />
      <div className="grid">
        {acik ? (
          <>
            <Panel className="s7" baslik="Etkinlik türüne göre katılım" alt={`${savasSayisi} geçmiş etkinlik`}>
              <TurGrafigi satirlar={turKatilimi(gecmis, yoklamalar, turler)} />
            </Panel>
            <Panel className="s5" baslik="En istikrarlı üyeler" alt="Geçmiş etkinlikler">
              {top5.length ? (
                <ol className="list top5">
                  {top5.map((x, i) => (
                    <li key={x.k.id}>
                      <span className="rk">{i + 1}</span>
                      <span className="who" style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                        <span className="cls">{x.k.sinif && <i className={`c-${SINIF_KISA[x.k.sinif]}`} />}</span>
                        <Link href={`/uyeler/${x.k.id}`} style={{ fontWeight: 600 }}>{x.k.ad}</Link>
                        {x.k.sinif && <span className="muted" style={{ fontSize: 13 }}>{sinifAdi(x.k.sinif, ayar.irk)}</span>}
                      </span>
                      <span className="num" style={{ font: "600 15px var(--font-data)" }}>%{x.oran.yuzde} <span className="muted" style={{ fontWeight: 500 }}>{x.oran.gelen}/{x.oran.toplam}</span></span>
                    </li>
                  ))}
                </ol>
              ) : <div className="empty">Henüz yoklama yok.</div>}
            </Panel>
          </>
        ) : (
          <div className="s12 callout">Sunucu açılmadan önce yalnızca klan toplantıları yoklamaya tabi. CSW, BDW, Juraid ve diğer savaş etkinlikleri açılıştan sonra burada türlerine göre karşılaştırılacak.</div>
        )}
        <div className="s12 ev-layout">
          <nav className="panel" aria-label="Etkinlik listesi">
            {gruplar.yaklasan.length > 0 && <><div className="ev-group">Yaklaşan</div>{gruplar.yaklasan.map((e) => <Oge key={e.id} e={e} />)}</>}
            <div className="ev-group">Geçmiş</div>
            {gecmisListe.map((e) => <Oge key={e.id} e={e} />)}
            {!gruplar.gecmis.length && <div className="empty">Henüz geçmiş etkinlik yok.</div>}
            {!tum && gruplar.gecmis.length > GECMIS_ADET && (
              <Link href={`/etkinlikler?tum=1${secili ? `&e=${encodeURIComponent(secili.id)}` : ""}`} scroll={false} className="btn" style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
                Tüm geçmişi göster ({gruplar.gecmis.length})
              </Link>
            )}
          </nav>
          <DetayaKaydir hedef="etkinlik-detayi" secili={secili?.id} />
          <section className="panel detail" id="etkinlik-detayi" style={{ scrollMarginTop: 12 }}>
            {secili ? <Detay e={secili} /> : <div className="empty">Henüz etkinlik yok.{yetkili && " Sağ üstten ilk etkinliği oluştur."}</div>}
          </section>
        </div>
      </div>
    </>
  );

  function Detay({ e }: { e: Etkinlik }) {
    const t = tur(e.tur);
    const kadro = yoklamaKadrosu(karakterler, yoklamalar, e.id);
    const isaretler = isaretHaritasi(yoklamalar, e.id);
    return (
      <>
        <Tag>{t?.kisaAd ?? e.tur}</Tag>
        <h2>{e.baslik}</h2>
        <div className="when2">
          {uzunTarih(e.baslangic)} · {saatMetni(e.baslangic)}{e.bitis ? `–${saatMetni(e.bitis)}` : ""} TSİ · {goreliZaman(e.baslangic, su)}
        </div>
        {e.aciklama && <p className="desc" style={{ whiteSpace: "pre-line" }}>{e.aciklama}</p>}
        {yetkili && <EtkinlikIslemleri id={e.id} baslik={e.baslik} deger={etkinliktenForm(e)} turler={turler} yoklamaSayisi={Object.keys(isaretler).length} />}
        {!yoklamaAcik(e, su) ? (
          <div className="callout" style={{ marginTop: 16 }}>
            Yoklama etkinlik saatinde açılır. {yetkili ? "Kadroyu Takvim ve duyurular sekmesinden duyurun; TeamSpeak’e de gönderilebilir." : "Katılamayacaksan yetkililere haber ver."}
          </div>
        ) : (
          <YoklamaListesi eventId={e.id} kadro={kadro.map((k) => ({ id: k.id, ad: k.ad, sinif: k.sinif, rutbe: k.rutbe }))} isaretler={isaretler} yetkili={yetkili} irk={ayar.irk} />
        )}
      </>
    );
  }
}
