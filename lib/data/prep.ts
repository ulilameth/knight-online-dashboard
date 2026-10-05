// Hazırlık listesi: herkes kendi adımlarını işaretler, klanın durumunu herkes görür.
import type { Database } from "@/lib/database.types";
import type { Hazirlik } from "@/lib/types";
import { type Db, type DemoBaglam, VeriHatasi, demoYetki, hazirlik, sorgu } from "./ortak";

type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];

export type HazirlikAdimi = keyof Omit<Hazirlik, "profileId">;
export const HAZIRLIK_ADIMLARI: readonly HazirlikAdimi[] = ["otp", "onKayit", "sunucuSecimi", "karakterAdi", "klanaKatildi"];
const SUTUN: Record<HazirlikAdimi, "otp" | "on_kayit" | "sunucu_secimi" | "karakter_adi" | "klana_katildi"> = {
  otp: "otp", onKayit: "on_kayit", sunucuSecimi: "sunucu_secimi", karakterAdi: "karakter_adi", klanaKatildi: "klana_katildi",
};

export interface HazirlikVerisi {
  hazirliklar(): Promise<Hazirlik[]>;
  /** Kendi satırı */
  isaretle(adim: HazirlikAdimi, deger: boolean): Promise<Hazirlik>;
}

export function demoHazirlik(b: DemoBaglam): HazirlikVerisi {
  return {
    async hazirliklar() { demoYetki(b, "uye"); return structuredClone(b.depo.hazirliklar); },
    async isaretle(adim, deger) {
      const p = demoYetki(b, "uye");
      if (!HAZIRLIK_ADIMLARI.includes(adim)) throw new VeriHatasi("Bilinmeyen adım");
      let h = b.depo.hazirliklar.find((x) => x.profileId === p.id);
      if (!h) b.depo.hazirliklar.push((h = { profileId: p.id, otp: false, onKayit: false, sunucuSecimi: false, karakterAdi: false, klanaKatildi: false }));
      h[adim] = deger;
      return { ...h };
    },
  };
}

export function supabaseHazirlik(db: Db): HazirlikVerisi {
  return {
    async hazirliklar() { return (await sorgu(db.from("hazirlik").select("*"))).map(hazirlik); },
    async isaretle(adim, deger) {
      if (!HAZIRLIK_ADIMLARI.includes(adim)) throw new VeriHatasi("Bilinmeyen adım");
      const id = (await db.auth.getUser()).data.user?.id;
      if (!id) throw new VeriHatasi("Bu işlem için yetkin yok");
      const satir: TablesInsert<"hazirlik"> = { profile_id: id };
      satir[SUTUN[adim]] = deger;
      const r = await sorgu(db.from("hazirlik").upsert(satir).select().single());
      return hazirlik(r);
    },
  };
}
