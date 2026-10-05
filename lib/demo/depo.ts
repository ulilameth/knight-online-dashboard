// Demo modunun bellekteki veritabanı. Sunucu süreci boyunca yaşar (yeniden başlayınca örnek veriye döner).
import { createHash } from "node:crypto";
import { simdi } from "@/lib/time";
import type {
  Asama, Build, DavetKodu, Duyuru, Etkinlik, EtkinlikTuru, HaftalikDuzen, Hazirlik, Karakter, KarakterDegisikligi,
  KlanAyarlari, Profil, Yoklama,
} from "@/lib/types";
import * as f from "./fixtures";

export interface DemoDepo {
  ayarlar: KlanAyarlari;
  profiller: Profil[];
  karakterler: Karakter[];
  degisiklikler: KarakterDegisikligi[];
  hazirliklar: Hazirlik[];
  asamalar: Asama[];
  etkinlikTurleri: EtkinlikTuru[];
  haftalikDuzen: HaftalikDuzen[];
  etkinlikler: Etkinlik[];
  yoklamalar: Yoklama[];
  duyurular: Duyuru[];
  davetKodlari: (DavetKodu & { kodHash: string })[];
  davetKullanimlari: { codeId: string; profileId: string; createdAt: string }[];
  sifirlamalar: { profileId: string; kodHash: string; bitis: string; kullanildi: boolean }[];
  buildler: Build[];
  /** profil kimliği → { e-posta, şifre } (Supabase Auth'un yerine) */
  hesaplar: Map<string, { eposta: string; sifre: string }>;
  denemeler: Map<string, number[]>;
  sayac: number;
}

export const demoKodHash = (kod: string) => createHash("sha256").update(kod.replace(/\s/g, "").toUpperCase()).digest("hex");

export function yeniDemoDepo(): DemoDepo {
  const kopya = <T>(x: T): T => structuredClone(x);
  const depo: DemoDepo = {
    ayarlar: kopya(f.ayarlar),
    profiller: kopya(f.profiller),
    karakterler: kopya(f.karakterler),
    degisiklikler: [],
    hazirliklar: kopya(f.hazirliklar),
    asamalar: kopya(f.asamalar),
    etkinlikTurleri: kopya(f.etkinlikTurleri),
    haftalikDuzen: kopya(f.haftalikDuzen),
    etkinlikler: kopya(f.etkinlikler),
    yoklamalar: f.yoklamalar(simdi()),
    duyurular: kopya(f.duyurular),
    davetKodlari: [],
    davetKullanimlari: [],
    sifirlamalar: [],
    buildler: kopya(f.buildler),
    hesaplar: new Map(f.profiller.map((p) => [p.id, { eposta: `${p.id}@demo.l4bel.invalid`, sifre: f.DEMO_SIFRE }])),
    denemeler: new Map(),
    sayac: 0,
  };
  depo.davetKodlari.push({
    id: "dk-demo", kodHash: demoKodHash(f.DEMO_DAVET_KODU), sonDort: f.DEMO_DAVET_KODU.slice(-4), rutbe: "uye",
    maxKullanim: 500, kullanim: 0, bitis: "2099-01-01T00:00:00.000Z", aktif: true, aciklama: "Demo kodu",
    olusturan: f.profilId("KaraBey"), createdAt: f.ayarlar.acilisAt,
  });
  return depo;
}

const kuresel = globalThis as unknown as { __l4belDemoDepo?: DemoDepo };

/** Süreç başına tek depo (geliştirmede modül yeniden yüklense de veri korunur) */
export function demoDepo(): DemoDepo {
  return (kuresel.__l4belDemoDepo ??= yeniDemoDepo());
}

export function yeniId(depo: DemoDepo, onek: string) {
  depo.sayac += 1;
  return `${onek}-${depo.sayac}-${Math.random().toString(36).slice(2, 8)}`;
}
