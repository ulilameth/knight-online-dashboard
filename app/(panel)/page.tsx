import type { Metadata } from "next";
import { BenimHazirligim } from "@/components/genel/BenimHazirligim";
import { GeriSayim } from "@/components/genel/GeriSayim";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { DuyuruKarti } from "@/components/ortak/DuyuruKarti";
import { KopyalaDugmesi } from "@/components/ortak/KopyalaDugmesi";
import { SinifDagilimi } from "@/components/ortak/SinifDagilimi";
import { TurGrafigi } from "@/components/ortak/TurGrafigi";
import { LinkButton } from "@/components/ui/Button";
import { Ikon } from "@/components/ui/Ikon";
import { Meter } from "@/components/ui/Durum";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { TarihKutusu } from "@/components/ui/TarihKutusu";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { HAZIRLIK, acilisAni } from "@/lib/hazirlik";
import { asamaDurumu, asamaTarihi, gecmisEtkinlikler, sayim, toplamKatilim, turKatilimi } from "@/lib/istatistik";
import { acildiMi, bicimle, gunGoreli, gunMetni, haftaninPazartesisi, saatMetni, simdi, tsi, tsiGunu } from "@/lib/time";

export const metadata: Metadata = { title: "Genel bakış" };

const uzunTarih = (iso: string) => bicimle(iso, { day: "numeric", month: "long", weekday: "long" });

export default async function GenelBakis() {
  const kullanici = await requireYetki("uye");
  const v = await veri();
  const [ayar, asamalar, karakterler, hazirliklar, etkinlikler, turler, yoklamalar, duyurular] = await Promise.all([
    v.ayarlar.ayarlar(), v.asamalar.asamalar(), v.uyeler.karakterler(), v.hazirlik.hazirliklar(),
    v.etkinlikler.etkinlikler(), v.etkinlikler.turler(), v.yoklamalar.yoklamalar(), v.duyurular.duyurular(),
  ]);
  const su = simdi();
  const once = !acildiMi(ayar.acilisAt, su);
  const tur = (kod: string) => turler.find((t) => t.kod === kod);
  const yazar = (profilId: string | null) => karakterler.find((k) => k.profileId === profilId)?.ad ?? "Yetkili";
  const yoklamali = etkinlikler.filter((e) => tur(e.tur)?.yoklamaVar).sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  const gecmis = gecmisEtkinlikler(etkinlikler, turler, su);
  const ana = karakterler.filter((k) => k.anaKarakter && k.durum !== "ayrildi");

  // Kahraman alanı: açılıştan önce açılışa, sonra sıradaki etkinliğe geri sayım
  const siradaki = yoklamali.find((e) => Date.parse(e.baslangic) > su.getTime());
  const hedef = once ? ayar.acilisAt : siradaki?.baslangic ?? null;
  const kaynak = asamalar.find((a) => a.kaynakUrl)?.kaynakUrl;
  const simdiki = asamalar.find((a) => a.sira < 4 && asamaDurumu(a, su) === "simdi");
  const sonraki = asamalar.find((a) => a.sira < 4 && asamaDurumu(a, su) === "gelecek");
  const ondanSonra = siradaki && yoklamali.find((e) => e.baslangic > siradaki.baslangic);
  const sonEtkinlik = gecmis.filter((e) => e.tur !== "toplanti").at(-1) ?? gecmis.at(-1);

  // Hazırlık: aktif ve izinli üyeler
  const hazirlikAdimlari = HAZIRLIK.filter((t) => (once ? !t.acilistanSonra : t.acilistanSonra));
  const aktifler = ana.filter((k) => k.durum !== "pasif");
  const hazirlikOf = (profilId: string | null) => hazirliklar.find((h) => h.profileId === profilId);
  const benim = hazirlikOf(kullanici.profil.id);

  // Açılış sonrası kutular
  const yediGun = gecmis.filter((e) => Date.parse(e.baslangic) > su.getTime() - 7 * 86_400_000);
  const yediGunKatilim = toplamKatilim(yediGun.map((e) => e.id), yoklamalar);
  const pazartesi = Date.parse(tsi(haftaninPazartesisi(su)));
  const buHafta = yoklamali.filter((e) => Date.parse(e.baslangic) >= pazartesi && Date.parse(e.baslangic) < pazartesi + 7 * 86_400_000).length;
  const levelliler = ana.filter((k) => k.level);

  // Yaklaşanlar: etkinlikler + resmi aşamalar
  const bugun = Date.parse(tsi(tsiGunu(su)));
  const yaklasan = [
    ...etkinlikler.filter((e) => Date.parse(e.baslangic) > su.getTime()).map((e) => ({ id: e.id, baslik: e.baslik, an: e.baslangic, tumGun: false, etiket: tur(e.tur)?.kisaAd ?? e.tur, resmi: false })),
    ...asamalar.filter((a) => Date.parse(a.baslangic) >= bugun).map((a) => ({ id: `a${a.id}`, baslik: a.baslik, an: a.baslangic, tumGun: !a.saatBelli, etiket: "Resmi", resmi: true })),
  ].sort((a, b) => a.an.localeCompare(b.an)).slice(0, 5);
  const sabit = duyurular.find((d) => d.sabit) ?? duyurular[0];

  return (
    <>
      <SayfaBasligi ust={once ? "Açılışa hazırlık" : "Bu hafta"} baslik={once ? "Yeni sunucuya klanca hazırız" : "Klan durumu"} />
      <div className="grid">
        <div className="s12 hero">
          <div>
            <div className="eyebrow">{once ? "Yeni sunucu · NTTGame" : siradaki ? `${tur(siradaki.tur)?.kisaAd} · ${uzunTarih(siradaki.baslangic)}` : "Etkinlik planı"}</div>
            <h2>{once ? "Sunucu açılışına" : siradaki ? `Sıradaki: ${siradaki.baslik}` : "Planlanmış etkinlik yok"}</h2>
            {hedef && <GeriSayim hedef={hedef} sunucuSimdi={su.toISOString()} />}
            {hedef && (
              <div className="when">
                {once ? `${bicimle(hedef, { day: "numeric", month: "long", year: "numeric", weekday: "long" })} · ${saatMetni(hedef)} TSİ` : `${uzunTarih(hedef)} · ${saatMetni(hedef)} TSİ`}
              </div>
            )}
          </div>
          <div className="next">
            {once ? (
              <>
                <div>
                  <div className="eyebrow">{simdiki ? "Şu anki aşama" : "Sıradaki adım"}</div>
                  {simdiki ? (
                    <><h3>{simdiki.baslik}</h3><p>{asamaTarihi(simdiki)}</p><div className="rel">Devam ediyor</div></>
                  ) : sonraki ? (
                    <><h3>{sonraki.baslik}</h3><p>{uzunTarih(sonraki.baslangic)}</p><div className="rel">{gunGoreli(sonraki.baslangic, su)}</div></>
                  ) : (
                    <><h3>Sunucu açılıyor</h3><p>{asamaTarihi(asamalar.at(-1) ?? asamalar[0])}</p></>
                  )}
                </div>
                {kaynak && <a href={kaynak} target="_blank" rel="noopener" className="btn" style={{ alignSelf: "flex-start" }}>Resmi duyuru <Ikon ad="i-out" /></a>}
              </>
            ) : (
              <>
                {ondanSonra && (
                  <div><div className="eyebrow">Ondan sonra</div><h3>{ondanSonra.baslik}</h3><p>{uzunTarih(ondanSonra.baslangic)} · {saatMetni(ondanSonra.baslangic)}</p></div>
                )}
                {sonEtkinlik && (() => {
                  const c = sayim(yoklamalar, sonEtkinlik.id);
                  return <div><div className="eyebrow">Son etkinlik</div><h3>{sonEtkinlik.baslik}</h3><p>{c.katildi + c.gec} / {ana.length} katıldı</p></div>;
                })()}
              </>
            )}
          </div>
        </div>

        {once ? (
          <Panel className="s12" baslik="Açılış takvimi" alt={`Saati duyurulan yalnızca açılış (${saatMetni(ayar.acilisAt)}, TSİ)`}>
            <ol className="phases">
              {asamalar.map((a) => {
                const d = asamaDurumu(a, su);
                return (
                  <li key={a.id} className={`phase ${d === "bitti" ? "done" : d === "simdi" ? "current" : ""}`}>
                    <div className="n"><b>{a.sira}</b>{d === "bitti" ? <Tag>Tamamlandı</Tag> : d === "simdi" ? <Tag resmi>Şu an</Tag> : <Tag>{gunGoreli(a.baslangic, su)}</Tag>}</div>
                    <h3>{a.baslik}</h3>
                    <div className="d">{asamaTarihi(a)}</div>
                    {a.aciklama && <div className="x">{a.aciklama}</div>}
                  </li>
                );
              })}
            </ol>
          </Panel>
        ) : (
          <div className="s12 tiles">
            {([
              ["Aktif üye", <>{ana.filter((k) => k.durum === "aktif").length}<small> / {ana.length}</small></>, `${ana.filter((k) => k.durum === "izinli").length} izinli, ${ana.filter((k) => k.durum === "pasif").length} pasif`],
              ["Son 7 gün katılım", yediGunKatilim.yuzde === null ? "—" : `%${yediGunKatilim.yuzde}`, `${yediGun.length} etkinlik, ${yediGunKatilim.gelen} katılım`],
              ["Bu haftaki etkinlik", buHafta, "Pazartesi – Pazar"],
              ["Ortalama level", levelliler.length ? Math.round(levelliler.reduce((t, k) => t + (k.level ?? 0), 0) / levelliler.length) : "—", levelliler.length ? `En yüksek ${Math.max(...levelliler.map((k) => k.level ?? 0))}` : "Level girilmedi"],
            ] as const).map(([l, deger, alt]) => (
              <div className="panel tile" key={l}><div className="eyebrow">{l}</div><div className="v num">{deger}</div><div className="s">{alt}</div></div>
            ))}
          </div>
        )}

        <div className="s7 stack">
          <Panel baslik={once ? "Klan hazırlığı" : "Klana katılım"} alt={`${aktifler.length} aktif ve izinli üye`}>
            {hazirlikAdimlari.map((t) => {
              const acilis = acilisAni(t, asamalar);
              const acik = !acilis || Date.parse(acilis) <= su.getTime();
              const n = aktifler.filter((k) => hazirlikOf(k.profileId)?.[t.adim]).length;
              return (
                <div className="prep-row" key={t.adim}>
                  <div><h3>{t.ad}</h3><p>{t.ipucu}</p></div>
                  {acik ? (
                    <><Meter yuzde={aktifler.length ? (n / aktifler.length) * 100 : 0} etiket={`${n} / ${aktifler.length}`} /><div className="prep-n num">{n}/{aktifler.length}</div></>
                  ) : (
                    <div className="locked" style={{ gridColumn: "span 2" }}><Ikon ad="i-lock" />{gunMetni(acilis!)}’da açılır</div>
                  )}
                </div>
              );
            })}
            <div className="mine">
              <h3>Benim hazırlığım</h3>
              <BenimHazirligim
                adimlar={hazirlikAdimlari.map((t) => {
                  const acilis = acilisAni(t, asamalar);
                  const acik = !acilis || Date.parse(acilis) <= su.getTime();
                  return { adim: t.adim, ad: t.ad, acik, kilit: acik ? undefined : `${gunMetni(acilis!)}’da açılır`, isaretli: !!benim?.[t.adim] };
                })}
              />
            </div>
          </Panel>
          {!once && (
            <Panel baslik="Etkinlik türüne göre katılım" alt={`${gecmis.length} geçmiş etkinlik`}>
              <TurGrafigi satirlar={turKatilimi(gecmis, yoklamalar, turler)} />
            </Panel>
          )}
          <Panel baslik={once ? "Planlanan sınıf dağılımı" : "Sınıf dağılımı"} alt={`${ana.length} karakter`}>
            <SinifDagilimi karakterler={ana} irk={ayar.irk} />
          </Panel>
        </div>

        <div className="s5 stack">
          <Panel baslik="TeamSpeak 3" alt="Toplantılar ve savaşlar burada">
            <div className="ts-row">
              <div><div className="eyebrow">Sunucu adresi</div><div className="ts-addr">{ayar.tsAdres}</div></div>
              <KopyalaDugmesi metin={ayar.tsAdres} bildirim={`Sunucu adresi kopyalandı: ${ayar.tsAdres}`} />
            </div>
            <p className="muted" style={{ fontSize: 13, margin: "10px 0 0" }}>TeamSpeak 3’te Bağlan › Sunucu adresi alanına {ayar.tsAdres} yaz.</p>
          </Panel>
          <Panel baslik="Yaklaşanlar" sag={<LinkButton href="/takvim">Takvim</LinkButton>}>
            <ul className="list">
              {yaklasan.length ? yaklasan.map((x) => (
                <li className="item" key={x.id}>
                  <TarihKutusu iso={x.an} />
                  <div style={{ minWidth: 0 }}><h3>{x.baslik}</h3><p>{x.tumGun ? "Tüm gün" : saatMetni(x.an)} · {gunGoreli(x.an, su)}</p></div>
                  <Tag resmi={x.resmi}>{x.etiket}</Tag>
                </li>
              )) : <li className="empty">Yaklaşan etkinlik yok.</li>}
            </ul>
          </Panel>
          <Panel baslik="Sabitlenmiş duyuru">
            {sabit ? <DuyuruKarti duyuru={sabit} yazar={yazar(sabit.yazar)} /> : <p className="muted" style={{ margin: 0 }}>Henüz duyuru yok.</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
