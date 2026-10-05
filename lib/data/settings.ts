// Ayarlar: klan bilgisi, açılış, TS adresi, level sınırı (yönetici), yetki verme.
import type { KlanAyarlari, Yetki } from "@/lib/types";
import { type Db, type DemoBaglam, belki, calistir, VeriHatasi, ayarlar, demoYetki, sorgu } from "./ortak";

export interface AyarVerisi {
  /** Girişten önce de okunur (klan adı, arma) */
  ayarlar(): Promise<KlanAyarlari>;
  /** Yönetici */
  ayarlarGuncelle(g: Partial<KlanAyarlari>): Promise<KlanAyarlari>;
  /** Yönetici; son yönetici kendini düşüremez */
  yetkiVer(profileId: string, yetki: Yetki): Promise<void>;
}

/** Ayarlar'daki tek seçim kutusu: "80", "83", "83+1" … "83+10" */
export function levelSiniriCoz(secim: string): Pick<KlanAyarlari, "levelSiniri" | "rebSiniri"> {
  const m = /^(80|83)(?:\+(10|[1-9]))?$/.exec(secim.trim());
  if (!m || (m[1] === "80" && m[2])) throw new VeriHatasi("Level sınırı 80, 83 ya da 83+1 … 83+10 olmalı");
  return { levelSiniri: Number(m[1]) as 80 | 83, rebSiniri: Number(m[2] ?? 0) };
}

export const levelSiniriMetni = (a: Pick<KlanAyarlari, "levelSiniri" | "rebSiniri">) =>
  a.rebSiniri ? `${a.levelSiniri}+${a.rebSiniri}` : String(a.levelSiniri);

function dogrula(g: Partial<KlanAyarlari>) {
  if (g.klanAdi !== undefined && !/^\S.{0,19}$/.test(g.klanAdi)) throw new VeriHatasi("Klan adı 1-20 karakter olmalı");
  if (g.monogram !== undefined && !/^\S{1,3}$/.test(g.monogram)) throw new VeriHatasi("Monogram 1-3 karakter olmalı");
  if (g.levelSiniri !== undefined && g.levelSiniri !== 80 && g.levelSiniri !== 83) throw new VeriHatasi("Level sınırı 80 ya da 83 olmalı");
  if (g.rebSiniri !== undefined && (g.rebSiniri < 0 || g.rebSiniri > 10)) throw new VeriHatasi("Reb sınırı 0 ile 10 arası olmalı");
  if (g.acilisAt !== undefined && Number.isNaN(Date.parse(g.acilisAt))) throw new VeriHatasi("Açılış tarihi geçersiz");
}

export function demoAyarlar(b: DemoBaglam): AyarVerisi {
  return {
    async ayarlar() { return { ...b.depo.ayarlar }; },
    async ayarlarGuncelle(g) {
      demoYetki(b, "yonetici");
      dogrula(g);
      const yeni = { ...b.depo.ayarlar, ...g };
      if (yeni.levelSiniri === 80 && yeni.rebSiniri) throw new VeriHatasi("Reb sınırı yalnızca level sınırı 83'ken verilir");
      b.depo.ayarlar = yeni;
      return { ...yeni };
    },
    async yetkiVer(profileId, yetki) {
      demoYetki(b, "yonetici");
      const p = b.depo.profiller.find((x) => x.id === profileId);
      if (!p) throw new VeriHatasi("Üye bulunamadı");
      if (yetki !== "yonetici" && p.yetki === "yonetici" && b.depo.profiller.filter((x) => x.yetki === "yonetici").length === 1) {
        throw new VeriHatasi("Klanın en az bir yöneticisi olmalı");
      }
      p.yetki = yetki;
    },
  };
}

export function supabaseAyarlar(db: Db): AyarVerisi {
  return {
    async ayarlar() { return ayarlar(await sorgu(db.from("clan_settings").select("*").single())); },
    async ayarlarGuncelle(g) {
      dogrula(g);
      const r = await belki(db.from("clan_settings").update({
        ...(g.klanAdi !== undefined && { klan_adi: g.klanAdi }),
        ...(g.yedekAd !== undefined && { yedek_ad: g.yedekAd }),
        ...(g.monogram !== undefined && { monogram: g.monogram }),
        ...(g.irk !== undefined && { irk: g.irk }),
        ...(g.sunucuAdi !== undefined && { sunucu_adi: g.sunucuAdi }),
        ...(g.tsAdres !== undefined && { ts_adres: g.tsAdres }),
        ...(g.acilisAt !== undefined && { acilis_at: g.acilisAt }),
        ...(g.levelSiniri !== undefined && { level_siniri: g.levelSiniri }),
        ...(g.rebSiniri !== undefined && { reb_siniri: g.rebSiniri }),
      }).eq("id", true).select().maybeSingle());
      if (!r) throw new VeriHatasi("Bu işlem için yetkin yok");
      return ayarlar(r);
    },
    async yetkiVer(profileId, yetki) {
      await calistir(db.rpc("yetki_ver", { p_profile_id: profileId, p_yetki: yetki }));
    },
  };
}
