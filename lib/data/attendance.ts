// Yoklama: yetkili işaretler, herkes görür. Katılım oranı = (katıldı + geç) / işaretlenmiş yoklama.
import type { Yoklama, YoklamaDurumu } from "@/lib/types";
import { type Db, type DemoBaglam, calistir, VeriHatasi, demoYetki, simdiIso, sorgu, yoklama } from "./ortak";

export interface YoklamaVerisi {
  /** eventId verilirse yalnızca o etkinliğin */
  yoklamalar(eventId?: string): Promise<Yoklama[]>;
  /** Yetkili; durum null ise işaret kaldırılır */
  isaretle(eventId: string, characterIds: string[], durum: YoklamaDurumu | null): Promise<void>;
}

/** Üye başına katılım oranı (yüzde, işaretlenmiş yoklama yoksa null) */
export function katilimOrani(yoklamalar: Yoklama[], characterId: string) {
  const benim = yoklamalar.filter((y) => y.characterId === characterId);
  if (!benim.length) return null;
  const gelen = benim.filter((y) => y.durum === "katildi" || y.durum === "gec").length;
  return { yuzde: Math.round((gelen / benim.length) * 100), gelen, toplam: benim.length, mazeretli: benim.filter((y) => y.durum === "mazeretli").length };
}

export function demoYoklamalar(b: DemoBaglam): YoklamaVerisi {
  return {
    async yoklamalar(eventId) {
      demoYetki(b, "uye");
      return b.depo.yoklamalar.filter((y) => !eventId || y.eventId === eventId).map((y) => ({ ...y }));
    },
    async isaretle(eventId, characterIds, durum) {
      const p = demoYetki(b, "yetkili");
      if (!b.depo.etkinlikler.some((e) => e.id === eventId)) throw new VeriHatasi("Etkinlik bulunamadı");
      b.depo.yoklamalar = b.depo.yoklamalar.filter((y) => !(y.eventId === eventId && characterIds.includes(y.characterId)));
      if (durum) {
        for (const characterId of characterIds) b.depo.yoklamalar.push({ eventId, characterId, durum, isaretleyen: p.id, updatedAt: simdiIso() });
      }
    },
  };
}

export function supabaseYoklamalar(db: Db): YoklamaVerisi {
  return {
    async yoklamalar(eventId) {
      let q = db.from("attendance").select("*");
      if (eventId) q = q.eq("event_id", eventId);
      return (await sorgu(q)).map(yoklama);
    },
    async isaretle(eventId, characterIds, durum) {
      if (!characterIds.length) return;
      if (!durum) {
        await calistir(db.from("attendance").delete().eq("event_id", eventId).in("character_id", characterIds));
        return;
      }
      const isaretleyen = (await db.auth.getUser()).data.user?.id;
      await calistir(db.from("attendance").upsert(characterIds.map((character_id) => ({ event_id: eventId, character_id, durum, isaretleyen }))));
    },
  };
}
