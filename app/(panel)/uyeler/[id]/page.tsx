import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SayfaBasligi } from "@/components/kabuk/SayfaBasligi";
import { DurumPill, Pill, SinifEtiketi } from "@/components/ui/Durum";
import { LinkButton } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { TarihKutusu } from "@/components/ui/TarihKutusu";
import { EkipmanIcerik } from "@/components/uyeler/EkipmanIcerik";
import { requireYetki } from "@/lib/auth";
import { veri } from "@/lib/data";
import { irkBul } from "@/lib/data/oyun";
import { DURUM_ADI, RUTBE_ADI, RUTBE_RENGI, sinifAdi } from "@/lib/etiketler";
import { gecmisEtkinlikler, uyeKatilimi } from "@/lib/istatistik";
import { katalog } from "@/lib/oyun/katalog-sunucu";
import { ekipmanOzeti } from "@/lib/oyun/ozet";
import { bicimle, gunMetni, saatMetni, simdi } from "@/lib/time";
import type { KarakterDurum, Rutbe, Sinif, YoklamaDurumu } from "@/lib/types";
import { yetkiYeterli } from "@/lib/types";

export const metadata: Metadata = { title: "Üye" };

const YOKLAMA: Record<YoklamaDurumu, [string, "good" | "warn" | "idle" | "crit"]> = { katildi: ["Katıldı", "good"], gec: ["Geç", "warn"], mazeretli: ["Mazeretli", "idle"], yok: ["Yok", "crit"] };
const ALAN: Record<string, string> = { ad: "Nick", sinif: "Sınıf", level: "Level", reb: "Reb", rutbe: "Rütbe", durum: "Durum", ana_karakter: "Ana karakter", profile_id: "Hesap" };

export default async function UyeDetayi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kullanici = await requireYetki("uye");
  const v = await veri();
  const k = await v.uyeler.karakter(id);
  if (!k) notFound();
  const [ayar, karakterler, profiller, etkinlikler, turler, yoklamalar, degisiklikler, buildler, irklar] = await Promise.all([
    v.ayarlar.ayarlar(), v.uyeler.karakterler(), v.uyeler.profiller(), v.etkinlikler.etkinlikler(), v.etkinlikler.turler(),
    v.yoklamalar.yoklamalar(), v.uyeler.degisiklikler(id), v.buildler.kayitliBuildler(), v.oyun.irklar(),
  ]);
  const su = simdi();
  const gecmis = gecmisEtkinlikler(etkinlikler, turler, su).reverse();
  const oran = uyeKatilimi(gecmis.map((e) => e.id), yoklamalar, k.id);
  const tur = (kod: string) => turler.find((t) => t.kod === kod);
  const kim = (profilId: string | null) => karakterler.find((x) => x.profileId === profilId)?.ad ?? "Sistem";
  const deger = (alan: string, d: string | null) => {
    if (d === null) return "—";
    if (alan === "sinif") return sinifAdi(d as Sinif, ayar.irk);
    if (alan === "rutbe") return RUTBE_ADI[d as Rutbe] ?? d;
    if (alan === "durum") return DURUM_ADI[d as KarakterDurum] ?? d;
    if (alan === "profile_id") return "bağlandı";
    if (alan === "ana_karakter") return d === "true" ? "evet" : "hayır";
    return d;
  };
  const build = buildler.find((b) => b.characterId === k.id);
  const profil = profiller.find((p) => p.id === k.profileId);
  const yetkili = yetkiYeterli(kullanici.profil.yetki, "yetkili");

  return (
    <>
      <SayfaBasligi ust="Üye" baslik={k.ad} sag={<LinkButton href="/uyeler">Üyeler</LinkButton>}
        aciklama={<><SinifEtiketi sinif={k.sinif} irk={ayar.irk} /> · <span style={{ color: RUTBE_RENGI[k.rutbe], fontWeight: 600 }}>{RUTBE_ADI[k.rutbe]}</span>{k.level ? ` · Level ${k.level}${k.reb ? `+${k.reb}` : ""}` : ""}</>} />
      <div className="grid">
        <div className="s7 stack">
          <Panel baslik="Katılım geçmişi" alt={oran ? `%${oran.yuzde} · ${oran.gelen}/${oran.toplam} etkinlik${oran.mazeretli ? ` · ${oran.mazeretli} mazeretli` : ""}` : "Henüz yoklama yok"}>
            <ul className="list">
              {gecmis.map((e) => {
                const y = yoklamalar.find((x) => x.eventId === e.id && x.characterId === k.id);
                return (
                  <li className="item" key={e.id}>
                    <TarihKutusu iso={e.baslangic} />
                    <div style={{ minWidth: 0 }}><h3>{e.baslik}</h3><p>{bicimle(e.baslangic, { weekday: "short" })} {saatMetni(e.baslangic)} · {tur(e.tur)?.kisaAd}</p></div>
                    {y ? <Pill tur={YOKLAMA[y.durum][1]}>{YOKLAMA[y.durum][0]}</Pill> : <span className="muted">İşaretlenmedi</span>}
                  </li>
                );
              })}
              {!gecmis.length && <li className="empty">Henüz geçmiş etkinlik yok.</li>}
            </ul>
          </Panel>
          {build && (
            <Panel baslik="Ekipman" alt={`${gunMetni(build.updatedAt)} kaydedildi${k.ekipmanGorunur === "gizli" ? " · Gizli" : ""}`}>
              <EkipmanIcerik ozet={ekipmanOzeti(build, irkBul(irklar, build.sinif, ayar.irk, build.irkTuru), katalog(), k.ad)} />
            </Panel>
          )}
        </div>
        <div className="s5 stack">
          <Panel baslik="Bilgiler">
            <ul className="list who-edits">
              <li><span>Durum</span><DurumPill durum={k.durum} /></li>
              <li><span>TeamSpeak</span><span>{profil?.tsNick ?? "—"}</span></li>
              <li><span>Hesap</span><span>{k.profileId ? "Var" : "Henüz kayıt olmadı"}</span></li>
              <li><span>Katılma</span><span>{gunMetni(k.katilmaTarihi)}</span></li>
              {yetkili && k.notlar && <li><span>Not</span><span style={{ textAlign: "right" }}>{k.notlar}</span></li>}
            </ul>
          </Panel>
          <Panel baslik="Değişiklik kaydı" alt="Sınıf, level, rütbe, durum">
            <ul className="list who-edits">
              {degisiklikler.map((d) => (
                <li key={d.id}>
                  <span><b style={{ fontWeight: 600 }}>{ALAN[d.alan] ?? d.alan}</b>: {deger(d.alan, d.eski)} → {deger(d.alan, d.yeni)}<br /><span className="muted" style={{ fontSize: 13 }}>{kim(d.degistiren)} · {gunMetni(d.createdAt)} {saatMetni(d.createdAt)}</span></span>
                </li>
              ))}
              {!degisiklikler.length && <li className="empty" style={{ display: "block" }}>Değişiklik yok.</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
