// Açılış aşamaları (resmi takvim). Tarihler kaynaklarda tutarsız olduğu için yönetici düzeltir.
import type { Asama } from "@/lib/types";
import { type Db, type DemoBaglam, belki, calistir, VeriHatasi, asama, demoYetki, sorgu } from "./ortak";

export type AsamaGirdisi = Omit<Asama, "id"> & { id?: number };

export interface AsamaVerisi {
  asamalar(): Promise<Asama[]>;
  /** Yönetici; id yoksa ekler */
  asamaKaydet(g: AsamaGirdisi): Promise<Asama>;
  /** Yönetici */
  asamaSil(id: number): Promise<void>;
}

function dogrula(g: AsamaGirdisi) {
  if (!g.baslik.trim()) throw new VeriHatasi("Başlık gerekli");
  if (Number.isNaN(Date.parse(g.baslangic))) throw new VeriHatasi("Başlangıç tarihi geçersiz");
  if (g.bitis && Date.parse(g.bitis) < Date.parse(g.baslangic)) throw new VeriHatasi("Bitiş başlangıçtan önce olamaz");
}

const sirala = (a: Asama[]) => a.sort((x, y) => x.sira - y.sira || x.baslangic.localeCompare(y.baslangic));

export function demoAsamalar(b: DemoBaglam): AsamaVerisi {
  return {
    async asamalar() { demoYetki(b, "uye"); return sirala(structuredClone(b.depo.asamalar)); },
    async asamaKaydet(g) {
      demoYetki(b, "yonetici");
      dogrula(g);
      const mevcut = g.id === undefined ? undefined : b.depo.asamalar.find((a) => a.id === g.id);
      if (g.id !== undefined && !mevcut) throw new VeriHatasi("Aşama bulunamadı");
      const yeni: Asama = { ...g, id: mevcut?.id ?? Math.max(0, ...b.depo.asamalar.map((a) => a.id)) + 1 };
      if (mevcut) Object.assign(mevcut, yeni);
      else b.depo.asamalar.push(yeni);
      return { ...yeni };
    },
    async asamaSil(id) {
      demoYetki(b, "yonetici");
      b.depo.asamalar = b.depo.asamalar.filter((a) => a.id !== id);
    },
  };
}

export function supabaseAsamalar(db: Db): AsamaVerisi {
  return {
    async asamalar() { return (await sorgu(db.from("milestones").select("*").order("sira").order("baslangic"))).map(asama); },
    async asamaKaydet(g) {
      dogrula(g);
      const satir = {
        sira: g.sira, baslik: g.baslik.trim(), baslangic: g.baslangic, bitis: g.bitis, saat_belli: g.saatBelli,
        aciklama: g.aciklama, kaynak_url: g.kaynakUrl,
      };
      const r = g.id === undefined
        ? await sorgu(db.from("milestones").insert(satir).select().single())
        : await belki(db.from("milestones").update(satir).eq("id", g.id).select().maybeSingle());
      if (!r) throw new VeriHatasi("Bu işlem için yetkin yok");
      return asama(r);
    },
    async asamaSil(id) { await calistir(db.from("milestones").delete().eq("id", id)); },
  };
}
