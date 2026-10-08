"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Pill, type PillTuru } from "@/components/ui/Durum";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFormAksiyonu } from "@/components/ui/useFormAksiyonu";
import { type AyarSonucu, davetIptalAksiyonu, davetOlusturAksiyonu, sifirlamaKoduAksiyonu, yetkiAksiyonu } from "@/lib/actions/ayarlar";
import { DAVET_DURUM_ADI, type DavetDurumu } from "@/lib/ayarlar";
import type { Yetki } from "@/lib/types";

const DURUM_TURU: Record<DavetDurumu, PillTuru> = { aktif: "good", iptal: "idle", doldu: "warn", suresi_doldu: "idle" };
const kodStili = { font: "700 24px/1.2 var(--font-data)", letterSpacing: ".08em", userSelect: "all" } as const;

function useKopyala() {
  const toast = useToast();
  return async (metin: string, bildirim = "Kopyalandı") => {
    try {
      await navigator.clipboard.writeText(metin);
      toast(bildirim);
    } catch {
      toast("Kopyalanamadı; kodu seçip kopyala");
    }
  };
}

export interface DavetSatiri {
  id: string;
  sonDort: string;
  rutbe: string;
  kullanim: string;
  bitis: string;
  durum: DavetDurumu;
  aciklama: string | null;
  olusturan: string;
}

export interface KatilimSatiri {
  nick: string;
  karakterId: string | null;
  kod: string;
  tarih: string;
}

/** Davet kodu üretme, listeleme, iptal; kimin hangi kodla katıldığı */
export function Davetler({ kodlar, katilimlar }: { kodlar: DavetSatiri[]; katilimlar: KatilimSatiri[] }) {
  const toast = useToast();
  const kopyala = useKopyala();
  const [durum, gonder, bekliyor] = useFormAksiyonu<NonNullable<AyarSonucu>>(davetOlusturAksiyonu);
  const [iptalEdiliyor, gecis] = useTransition();
  const [gizlenen, setGizlenen] = useState<string | null>(null);
  useEffect(() => { if (durum?.kod) toast(durum.tamam ?? ""); }, [durum, toast]);
  // Sunucudan gelen tam kod yalnızca bu yanıtta var; "Gizle" ile kapanır
  const yeniKod = durum?.kod && durum.kod !== gizlenen ? durum.kod : null;

  return (
    <>
      <form action={gonder.action} onSubmit={gonder.onSubmit} className="form" noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
          <div><label htmlFor="d-rutbe">Rütbe</label><select className="sel" id="d-rutbe" name="rutbe" defaultValue="aday" style={{ width: "100%", marginTop: 6 }}>
            <option value="aday">Aday</option><option value="uye">Üye</option></select></div>
          <div><label htmlFor="d-gun">Geçerlilik</label><select className="sel" id="d-gun" name="gun" defaultValue="7" style={{ width: "100%", marginTop: 6 }}>
            {[1, 3, 7, 14, 30].map((g) => <option key={g} value={g}>{g} gün</option>)}</select></div>
          <div><label htmlFor="d-max">Kaç kişi</label><input type="number" id="d-max" name="max" defaultValue={25} min={1} max={500} /></div>
        </div>
        <div><label htmlFor="d-aciklama">Not (isteğe bağlı)</label><input type="text" id="d-aciklama" name="aciklama" maxLength={80} placeholder="Örn. TS duyurusu, eski klan üyeleri" /></div>
        {durum?.hata && <p className="crit-note" role="alert" style={{ margin: 0 }}>{durum.hata}</p>}
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>Kod yalnızca oluşturulduğu anda tam görünür; TeamSpeak’te ya da özelden paylaş.</span>
          <button className="btn primary" type="submit" disabled={bekliyor}>{bekliyor ? "Oluşturuluyor…" : "Kod oluştur"}</button>
        </div>
      </form>
      {yeniKod && (
        <div className="callout" role="status" style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">Yeni davet kodu</div>
            <div style={kodStili} id="yeni-davet-kodu">{yeniKod}</div>
            <div className="muted" style={{ fontSize: 13 }}>Bu pencereden çıkınca tekrar gösterilmez. Kayıt sayfası: /kayit</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => kopyala(yeniKod, "Kod kopyalandı")}>Kopyala</button>
            <button type="button" className="btn" onClick={() => setGizlenen(yeniKod)}>Gizle</button>
          </div>
        </div>
      )}
      <div className="table-wrap">
        <table style={{ minWidth: 640 }}>
          <thead><tr><th>Kod</th><th>Rütbe</th><th>Kullanım</th><th>Geçerlilik sonu</th><th>Durum</th><th>Not</th><th><span className="sr-only">İşlem</span></th></tr></thead>
          <tbody>
            {kodlar.map((k) => (
              <tr key={k.id}>
                <td className="num">…{k.sonDort}</td>
                <td>{k.rutbe}</td>
                <td className="num">{k.kullanim}</td>
                <td className="num">{k.bitis}</td>
                <td><Pill tur={DURUM_TURU[k.durum]}>{DAVET_DURUM_ADI[k.durum]}</Pill></td>
                <td><span className="muted" style={{ fontSize: 13 }}>{k.aciklama ?? "—"} · {k.olusturan}</span></td>
                <td>{k.durum === "aktif" && (
                  <button type="button" className="mini" disabled={iptalEdiliyor} onClick={() => gecis(async () => {
                    const r = await davetIptalAksiyonu(k.id);
                    toast(r?.hata ?? r?.tamam ?? "");
                  })}>İptal et</button>
                )}</td>
              </tr>
            ))}
            {!kodlar.length && <tr><td colSpan={7} className="empty">Henüz kod yok.</td></tr>}
          </tbody>
        </table>
      </div>
      <h3 className="pf-label" style={{ marginTop: 20 }}>Kodla katılanlar</h3>
      <ul className="list who-edits">
        {katilimlar.map((x, i) => (
          <li key={i}>
            <span>{x.karakterId ? <Link href={`/uyeler/${x.karakterId}`}>{x.nick}</Link> : x.nick} <span className="muted" style={{ fontSize: 13 }}>· …{x.kod}</span></span>
            <span className="muted num" style={{ fontSize: 13 }}>{x.tarih}</span>
          </li>
        ))}
        {!katilimlar.length && <li className="empty">Henüz kodla katılan yok.</li>}
      </ul>
    </>
  );
}

export interface HesapSatiri {
  profilId: string;
  karakterId: string | null;
  nick: string;
  rutbe: string;
  yetki: Yetki;
  sonGiris: string;
  /** Bu kullanıcı bu hesap için sıfırlama kodu üretebilir mi */
  sifirlanabilir: boolean;
  ben: boolean;
}

const YETKI_SECENEKLERI: [Yetki, string][] = [["uye", "Üye"], ["yetkili", "Yetkili"], ["yonetici", "Yönetici"]];

/** Hesaplar: yetki verme (yönetici) ve şifre sıfırlama kodu (yetkili Üye'ler için, yönetici herkes için) */
export function Hesaplar({ hesaplar, yonetici }: { hesaplar: HesapSatiri[]; yonetici: boolean }) {
  const toast = useToast();
  const kopyala = useKopyala();
  const [bekliyor, gecis] = useTransition();
  const [kod, setKod] = useState<{ nick: string; kod: string } | null>(null);
  const yetkiAdi = (y: Yetki) => YETKI_SECENEKLERI.find(([k]) => k === y)![1];
  return (
    <>
      <div className="table-wrap">
        <table style={{ minWidth: 560 }}>
          <thead><tr><th>Nick</th><th>Rütbe</th><th>Panel yetkisi</th><th>Son giriş</th><th><span className="sr-only">Şifre</span></th></tr></thead>
          <tbody>
            {hesaplar.map((h) => (
              <tr key={h.profilId}>
                <td className="name">{h.karakterId ? <Link href={`/uyeler/${h.karakterId}`}><b>{h.nick}</b></Link> : <b>{h.nick}</b>}{h.ben && <span className="muted"> (sen)</span>}</td>
                <td>{h.rutbe}</td>
                <td>
                  {yonetici ? (
                    <select className="sel" aria-label={`${h.nick} panel yetkisi`} value={h.yetki} disabled={bekliyor} onChange={(e) => {
                      const yeni = e.target.value as Yetki;
                      gecis(async () => {
                        const r = await yetkiAksiyonu(h.profilId, yeni);
                        toast(r?.hata ?? `${h.nick}: ${yetkiAdi(yeni)}`);
                      });
                    }}>
                      {YETKI_SECENEKLERI.map(([k, ad]) => <option key={k} value={k}>{ad}</option>)}
                    </select>
                  ) : yetkiAdi(h.yetki)}
                </td>
                <td className="num"><span className="muted" style={{ fontSize: 13 }}>{h.sonGiris}</span></td>
                <td>{h.sifirlanabilir && h.karakterId && (
                  <button type="button" className="mini" disabled={bekliyor} onClick={() => gecis(async () => {
                    const r = await sifirlamaKoduAksiyonu(h.karakterId!);
                    if (r?.kod) setKod({ nick: h.nick, kod: r.kod });
                    else toast(r?.hata ?? "Oluşturulamadı");
                  })}>Sıfırlama kodu</button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: "10px 0 0" }}>
        Yetkili: etkinlik, yoklama, üye ve duyuru yönetir. Yönetici: ayrıca klan bilgisi, açılış takvimi ve yetkiler. Klanın en az bir yöneticisi kalır.
      </p>
      {kod && (
        <Modal acik kapat={() => setKod(null)} baslik={`${kod.nick} · şifre sıfırlama`} genislik={480}>
          <div className="eyebrow">Tek kullanımlık kod, 24 saat geçerli</div>
          <div style={{ ...kodStili, margin: "6px 0 10px" }} id="sifirlama-kodu">{kod.kod}</div>
          <p style={{ marginTop: 0 }}>Kodu {kod.nick}’e özelden ilet. <b>/sifre-sifirla</b> sayfasında nick, kod ve yeni şifreyle şifresini değiştirir. Önceki kodlar geçersiz oldu.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn" onClick={() => kopyala(kod.kod, "Kod kopyalandı")}>Kopyala</button>
            <button type="button" className="btn primary" onClick={() => setKod(null)}>Tamam</button>
          </div>
        </Modal>
      )}
    </>
  );
}
