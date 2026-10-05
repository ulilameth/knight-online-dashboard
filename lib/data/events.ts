// Etkinlikler, etkinlik türleri ve haftalık düzenden etkinlik üretme.
import { tsi, tsiGunu } from "@/lib/time";
import type { Etkinlik, EtkinlikTuru, HaftalikDuzen } from "@/lib/types";
import { yeniId } from "@/lib/demo/depo";
import { type Db, type DemoBaglam, belki, calistir, VeriHatasi, demoYetki, duzen, etkinlik, etkinlikTuru, sorgu } from "./ortak";

export type EtkinlikGirdisi = Pick<Etkinlik, "tur" | "baslik" | "baslangic" | "bitis" | "aciklama"> & { id?: string };
export type DuzenGirdisi = Omit<HaftalikDuzen, "id"> & { id?: string };

export interface EtkinlikVerisi {
  turler(): Promise<EtkinlikTuru[]>;
  /** Başlangıca göre sıralı; aralık verilirse [baslangic, bitis) */
  etkinlikler(aralik?: { baslangic?: string; bitis?: string }): Promise<Etkinlik[]>;
  etkinlik(id: string): Promise<Etkinlik | null>;
  /** Yetkili; id yoksa ekler */
  etkinlikKaydet(g: EtkinlikGirdisi): Promise<Etkinlik>;
  /** Yetkili */
  etkinlikSil(id: string): Promise<void>;
  duzen(): Promise<HaftalikDuzen[]>;
  /** Yetkili */
  duzenKaydet(g: DuzenGirdisi): Promise<HaftalikDuzen>;
  /** Yetkili */
  duzenSil(id: string): Promise<void>;
  /** Yetkili: haftanın (pazartesi verilir) etkinliklerini aktif düzenden oluşturur; olanlar tekrar oluşturulmaz */
  haftayiOlustur(pazartesi: string): Promise<Etkinlik[]>;
}

function etkinlikDogrula(g: EtkinlikGirdisi) {
  if (!g.baslik.trim() || g.baslik.length > 120) throw new VeriHatasi("Başlık 1-120 karakter olmalı");
  if (Number.isNaN(Date.parse(g.baslangic))) throw new VeriHatasi("Başlangıç tarihi geçersiz");
  if (g.bitis && Date.parse(g.bitis) <= Date.parse(g.baslangic)) throw new VeriHatasi("Bitiş başlangıçtan sonra olmalı");
}

function duzenDogrula(g: DuzenGirdisi) {
  if (!g.baslik.trim()) throw new VeriHatasi("Başlık gerekli");
  if (!Number.isInteger(g.gun) || g.gun < 0 || g.gun > 6) throw new VeriHatasi("Gün 0 (pazar) ile 6 arası olmalı");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(g.saat)) throw new VeriHatasi("Saat SS:DD biçiminde olmalı");
  if (!(g.sureDk > 0)) throw new VeriHatasi("Süre 0'dan büyük olmalı");
}

/** Pazartesiden başlayan haftada düzenin oluşturacağı etkinlikler (TSİ) */
export function haftaninEtkinlikleri(pazartesi: string, duzenler: HaftalikDuzen[]): (EtkinlikGirdisi & { scheduleId: string })[] {
  const gun0 = tsiGunu(tsi(pazartesi.slice(0, 10)));
  if (new Date(`${gun0}T12:00:00Z`).getUTCDay() !== 1) throw new VeriHatasi("Hafta pazartesiden başlamalı");
  return duzenler.filter((d) => d.aktif).map((d) => {
    const fark = (d.gun + 6) % 7; // pazartesi 0 … pazar 6
    const gun = new Date(Date.parse(`${gun0}T12:00:00Z`) + fark * 86_400_000).toISOString().slice(0, 10);
    const baslangic = tsi(`${gun}T${d.saat}`);
    return {
      tur: d.tur, baslik: d.baslik, baslangic, bitis: new Date(Date.parse(baslangic) + d.sureDk * 60_000).toISOString(),
      aciklama: null, scheduleId: d.id,
    };
  }).sort((x, y) => x.baslangic.localeCompare(y.baslangic));
}

const aralikta = (e: Etkinlik, a?: { baslangic?: string; bitis?: string }) =>
  (!a?.baslangic || e.baslangic >= a.baslangic) && (!a?.bitis || e.baslangic < a.bitis);

export function demoEtkinlikler(b: DemoBaglam): EtkinlikVerisi {
  const d = b.depo;
  return {
    async turler() { demoYetki(b, "uye"); return structuredClone(d.etkinlikTurleri); },
    async etkinlikler(aralik) {
      demoYetki(b, "uye");
      return d.etkinlikler.filter((e) => aralikta(e, aralik)).sort((x, y) => x.baslangic.localeCompare(y.baslangic)).map((e) => ({ ...e }));
    },
    async etkinlik(id) { demoYetki(b, "uye"); const e = d.etkinlikler.find((x) => x.id === id); return e ? { ...e } : null; },
    async etkinlikKaydet(g) {
      const p = demoYetki(b, "yetkili");
      etkinlikDogrula(g);
      if (!d.etkinlikTurleri.some((t) => t.kod === g.tur)) throw new VeriHatasi("Etkinlik türü bilinmiyor");
      const mevcut = g.id ? d.etkinlikler.find((e) => e.id === g.id) : undefined;
      if (g.id && !mevcut) throw new VeriHatasi("Etkinlik bulunamadı");
      const yeni: Etkinlik = {
        id: mevcut?.id ?? yeniId(d, "e"), tur: g.tur, baslik: g.baslik.trim(), baslangic: g.baslangic, bitis: g.bitis,
        aciklama: g.aciklama, scheduleId: mevcut?.scheduleId ?? null, olusturan: mevcut?.olusturan ?? p.id,
      };
      if (mevcut) Object.assign(mevcut, yeni);
      else d.etkinlikler.push(yeni);
      return { ...yeni };
    },
    async etkinlikSil(id) {
      demoYetki(b, "yetkili");
      d.etkinlikler = d.etkinlikler.filter((e) => e.id !== id);
      d.yoklamalar = d.yoklamalar.filter((y) => y.eventId !== id);
    },
    async duzen() { demoYetki(b, "uye"); return structuredClone(d.haftalikDuzen).sort((x, y) => (x.gun + 6) % 7 - (y.gun + 6) % 7); },
    async duzenKaydet(g) {
      demoYetki(b, "yetkili");
      duzenDogrula(g);
      const mevcut = g.id ? d.haftalikDuzen.find((x) => x.id === g.id) : undefined;
      const yeni: HaftalikDuzen = { ...g, id: mevcut?.id ?? yeniId(d, "hd") };
      if (mevcut) Object.assign(mevcut, yeni);
      else d.haftalikDuzen.push(yeni);
      return { ...yeni };
    },
    async duzenSil(id) {
      demoYetki(b, "yetkili");
      d.haftalikDuzen = d.haftalikDuzen.filter((x) => x.id !== id);
      for (const e of d.etkinlikler) if (e.scheduleId === id) e.scheduleId = null;
    },
    async haftayiOlustur(pazartesi) {
      const p = demoYetki(b, "yetkili");
      const yeni: Etkinlik[] = [];
      for (const g of haftaninEtkinlikleri(pazartesi, d.haftalikDuzen)) {
        if (d.etkinlikler.some((e) => e.scheduleId === g.scheduleId && e.baslangic === g.baslangic)) continue;
        const e: Etkinlik = { ...g, id: yeniId(d, "e"), olusturan: p.id };
        d.etkinlikler.push(e);
        yeni.push({ ...e });
      }
      return yeni;
    },
  };
}

export function supabaseEtkinlikler(db: Db): EtkinlikVerisi {
  async function duzenOku() {
    const r = (await sorgu(db.from("recurring_schedules").select("*"))).map(duzen);
    return r.sort((x, y) => (x.gun + 6) % 7 - (y.gun + 6) % 7 || x.saat.localeCompare(y.saat));
  }
  return {
    async turler() { return (await sorgu(db.from("event_types").select("*").order("kod"))).map(etkinlikTuru); },
    async etkinlikler(aralik) {
      let q = db.from("events").select("*").order("baslangic");
      if (aralik?.baslangic) q = q.gte("baslangic", aralik.baslangic);
      if (aralik?.bitis) q = q.lt("baslangic", aralik.bitis);
      return (await sorgu(q)).map(etkinlik);
    },
    async etkinlik(id) {
      const r = await belki(db.from("events").select("*").eq("id", id).maybeSingle());
      return r ? etkinlik(r) : null;
    },
    async etkinlikKaydet(g) {
      etkinlikDogrula(g);
      const satir = { tur: g.tur, baslik: g.baslik.trim(), baslangic: g.baslangic, bitis: g.bitis, aciklama: g.aciklama };
      const r = g.id
        ? await belki(db.from("events").update(satir).eq("id", g.id).select().maybeSingle())
        : await sorgu(db.from("events").insert({ ...satir, olusturan: (await db.auth.getUser()).data.user?.id }).select().single());
      if (!r) throw new VeriHatasi("Bu işlem için yetkin yok");
      return etkinlik(r);
    },
    async etkinlikSil(id) { await calistir(db.from("events").delete().eq("id", id)); },
    duzen: duzenOku,
    async duzenKaydet(g) {
      duzenDogrula(g);
      const satir = { tur: g.tur, baslik: g.baslik.trim(), gun: g.gun, saat: g.saat, sure_dk: g.sureDk, aktif: g.aktif };
      const r = g.id
        ? await belki(db.from("recurring_schedules").update(satir).eq("id", g.id).select().maybeSingle())
        : await sorgu(db.from("recurring_schedules").insert(satir).select().single());
      if (!r) throw new VeriHatasi("Bu işlem için yetkin yok");
      return duzen(r);
    },
    async duzenSil(id) { await calistir(db.from("recurring_schedules").delete().eq("id", id)); },
    async haftayiOlustur(pazartesi) {
      const plan = haftaninEtkinlikleri(pazartesi, await duzenOku());
      if (!plan.length) return [];
      const mevcut = await sorgu(db.from("events").select("schedule_id, baslangic")
        .gte("baslangic", plan[0].baslangic).lte("baslangic", plan[plan.length - 1].baslangic));
      const var_ = new Set(mevcut.map((e) => `${e.schedule_id}|${Date.parse(e.baslangic)}`));
      const eklenecek = plan.filter((g) => !var_.has(`${g.scheduleId}|${Date.parse(g.baslangic)}`));
      if (!eklenecek.length) return [];
      const olusturan = (await db.auth.getUser()).data.user?.id;
      const r = await sorgu(db.from("events").insert(eklenecek.map((g) => ({
        tur: g.tur, baslik: g.baslik, baslangic: g.baslangic, bitis: g.bitis, aciklama: g.aciklama, schedule_id: g.scheduleId, olusturan,
      }))).select());
      return r.map(etkinlik);
    },
  };
}
