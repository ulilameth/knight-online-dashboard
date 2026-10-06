// Duyurular: yetkili yazar, sabitler, siler; TeamSpeak'e gönderildiyse zamanı tutulur (gönderim lib/teamspeak, oturum C).
import type { Duyuru } from "@/lib/types";
import { yeniId } from "@/lib/demo/depo";
import { type Db, type DemoBaglam, belki, calistir, VeriHatasi, demoYetki, duyuru, simdiIso, sorgu } from "./ortak";

export type DuyuruGirdisi = Pick<Duyuru, "baslik" | "govde" | "sabit"> & { id?: string };

export interface DuyuruVerisi {
  /** Sabitler önce, sonra yeniden eskiye */
  duyurular(): Promise<Duyuru[]>;
  /** Yetkili; id yoksa ekler */
  duyuruKaydet(g: DuyuruGirdisi): Promise<Duyuru>;
  /** Yetkili */
  duyuruSil(id: string): Promise<void>;
  /** Yetkili: TeamSpeak'e gönderildi */
  tsGonderildi(id: string): Promise<void>;
}

function dogrula(g: DuyuruGirdisi) {
  if (!g.baslik.trim() || g.baslik.length > 120) throw new VeriHatasi("Başlık 1-120 karakter olmalı");
  if (!g.govde.trim() || g.govde.length > 4000) throw new VeriHatasi("Metin 1-4000 karakter olmalı");
}

const sirala = (d: Duyuru[]) => d.sort((x, y) => Number(y.sabit) - Number(x.sabit) || y.createdAt.localeCompare(x.createdAt));

export function demoDuyurular(b: DemoBaglam): DuyuruVerisi {
  const bul = (id: string) => b.depo.duyurular.find((x) => x.id === id);
  return {
    async duyurular() { demoYetki(b, "uye"); return sirala(structuredClone(b.depo.duyurular)); },
    async duyuruKaydet(g) {
      const p = demoYetki(b, "yetkili");
      dogrula(g);
      const mevcut = g.id ? bul(g.id) : undefined;
      if (g.id && !mevcut) throw new VeriHatasi("Duyuru bulunamadı");
      const yeni: Duyuru = {
        id: mevcut?.id ?? yeniId(b.depo, "d"), baslik: g.baslik.trim(), govde: g.govde.trim(), sabit: g.sabit,
        tsGonderildiAt: mevcut?.tsGonderildiAt ?? null, yazar: mevcut?.yazar ?? p.id, createdAt: mevcut?.createdAt ?? simdiIso(),
      };
      if (mevcut) Object.assign(mevcut, yeni);
      else b.depo.duyurular.push(yeni);
      return { ...yeni };
    },
    async duyuruSil(id) { demoYetki(b, "yetkili"); b.depo.duyurular = b.depo.duyurular.filter((x) => x.id !== id); },
    async tsGonderildi(id) {
      demoYetki(b, "yetkili");
      const d = bul(id);
      if (!d) throw new VeriHatasi("Duyuru bulunamadı");
      d.tsGonderildiAt = simdiIso();
    },
  };
}

export function supabaseDuyurular(db: Db): DuyuruVerisi {
  return {
    async duyurular() {
      return (await sorgu(db.from("announcements").select("*").order("sabit", { ascending: false }).order("created_at", { ascending: false }))).map(duyuru);
    },
    async duyuruKaydet(g) {
      dogrula(g);
      const satir = { baslik: g.baslik.trim(), govde: g.govde.trim(), sabit: g.sabit };
      const r = g.id
        ? await belki(db.from("announcements").update(satir).eq("id", g.id).select().maybeSingle())
        : await sorgu(db.from("announcements").insert({ ...satir, yazar: (await db.auth.getUser()).data.user?.id }).select().single());
      if (!r) throw new VeriHatasi("Bu işlem için yetkin yok");
      return duyuru(r);
    },
    async duyuruSil(id) { await calistir(db.from("announcements").delete().eq("id", id)); },
    async tsGonderildi(id) {
      const r = await sorgu(db.from("announcements").update({ ts_gonderildi_at: new Date().toISOString() }).eq("id", id).select("id"));
      if (!r.length) throw new VeriHatasi("Duyuru bulunamadı ya da bu işlem için yetkin yok");
    },
  };
}
