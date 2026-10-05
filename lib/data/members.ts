// Üyeler ve Profilim: karakter listesi, yetkili düzenlemesi, üyenin kendi profili.
import { acildiMi, simdi } from "@/lib/time";
import type { Gorunurluk, Karakter, KarakterDegisikligi, KarakterDurum, KlanAyarlari, Profil, Rutbe, Sinif } from "@/lib/types";
import { yeniId } from "@/lib/demo/depo";
import { type Db, type DemoBaglam, belki, calistir, VeriHatasi, demoYetki, karakter, degisiklik, profil, simdiIso, sorgu } from "./ortak";

export interface KarakterGirdisi {
  ad: string;
  sinif: Sinif | null;
  irkTuru?: string | null;
  level: number | null;
  reb: number;
  rutbe: Rutbe;
  durum: KarakterDurum;
  notlar?: string | null;
}

export interface ProfilGirdisi {
  sinif?: Sinif;
  level?: number;
  reb?: number;
  ekipmanGorunur?: Gorunurluk;
  tsNick?: string | null;
}

export interface UyeVerisi {
  profiller(): Promise<Profil[]>;
  karakterler(): Promise<Karakter[]>;
  karakter(id: string): Promise<Karakter | null>;
  degisiklikler(characterId: string): Promise<KarakterDegisikligi[]>;
  /** Yetkili: hesabı olmayan karakter ekler (sahibi aynı nick'le kayıt olunca hesaba bağlanır) */
  karakterEkle(g: KarakterGirdisi): Promise<Karakter>;
  /** Yetkili */
  karakterGuncelle(id: string, g: Partial<KarakterGirdisi>): Promise<Karakter>;
  /** Üyenin kendisi: sınıf, level, reb, ekipman görünürlüğü, TS nick */
  profilGuncelle(g: ProfilGirdisi): Promise<Karakter>;
}

const NICK = /^\S{2,20}$/;

/** Yetkili formu için sunucu doğrulaması (veritabanı kısıtlarının Türkçe karşılığı) */
export function karakterGirdisiDogrula(g: Partial<KarakterGirdisi>) {
  if (g.ad !== undefined && !NICK.test(g.ad.trim())) throw new VeriHatasi("Nick 2-20 karakter olmalı ve boşluk içermemeli");
  if (g.level != null && (!Number.isInteger(g.level) || g.level < 1 || g.level > 83)) throw new VeriHatasi("Level 1 ile 83 arası olmalı");
  if (g.reb !== undefined && (!Number.isInteger(g.reb) || g.reb < 0 || g.reb > 10)) throw new VeriHatasi("Reb 0 ile 10 arası olmalı");
  if (g.reb && g.level !== undefined && g.level !== 83) throw new VeriHatasi("Reb yalnızca level 83'te girilir");
}

/**
 * profil_guncelle() kuralları (supabase/migrations/0001_init.sql ile aynı): level açılıştan sonra ve sınıra kadar,
 * reb yalnızca 83'te ve reb sınırına kadar; level 83'ten düşerse reb sıfırlanır.
 */
export function profilKurallari(ayar: KlanAyarlari, mevcut: Pick<Karakter, "level" | "reb">, g: ProfilGirdisi, su = simdi()) {
  const level = g.level ?? mevcut.level;
  let reb = g.reb ?? mevcut.reb;
  if (g.level !== undefined) {
    if (!acildiMi(ayar.acilisAt, su)) throw new VeriHatasi("Level sunucu açılınca girilir");
    if (!Number.isInteger(g.level) || g.level < 1 || g.level > ayar.levelSiniri) throw new VeriHatasi(`Level 1 ile ${ayar.levelSiniri} arası olmalı`);
  }
  if (level !== 83) reb = 0;
  else if (g.reb !== undefined && (g.reb < 0 || g.reb > ayar.rebSiniri)) throw new VeriHatasi(`Reb en fazla ${ayar.rebSiniri} olabilir`);
  return { level, reb };
}

// --- Demo ---

const IZLENEN: (keyof Karakter)[] = ["ad", "sinif", "level", "reb", "rutbe", "durum", "anaKarakter", "profileId"];
const SUTUN: Partial<Record<keyof Karakter, string>> = { anaKarakter: "ana_karakter", profileId: "profile_id" };

function demoKaydet(b: DemoBaglam, eski: Karakter, yeni: Karakter) {
  for (const alan of IZLENEN) {
    if (eski[alan] === yeni[alan]) continue;
    b.depo.degisiklikler.push({
      id: b.depo.degisiklikler.length + 1, characterId: yeni.id, alan: SUTUN[alan] ?? alan,
      eski: eski[alan] == null ? null : String(eski[alan]), yeni: yeni[alan] == null ? null : String(yeni[alan]),
      degistiren: b.kullaniciId, createdAt: simdiIso(),
    });
  }
  Object.assign(eski, yeni, { guncellendiAt: simdiIso() });
  return { ...eski };
}

export function demoUyeler(b: DemoBaglam): UyeVerisi {
  const bul = (id: string) => b.depo.karakterler.find((k) => k.id === id);
  const nickAlinmis = (ad: string, haric?: string) =>
    b.depo.karakterler.some((k) => k.id !== haric && k.ad.toLocaleLowerCase("tr") === ad.trim().toLocaleLowerCase("tr"));
  return {
    async profiller() { demoYetki(b, "uye"); return structuredClone(b.depo.profiller); },
    async karakterler() { demoYetki(b, "uye"); return structuredClone(b.depo.karakterler); },
    async karakter(id) { demoYetki(b, "uye"); const k = bul(id); return k ? { ...k } : null; },
    async degisiklikler(characterId) {
      demoYetki(b, "uye");
      return b.depo.degisiklikler.filter((d) => d.characterId === characterId).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    },
    async karakterEkle(g) {
      demoYetki(b, "yetkili");
      karakterGirdisiDogrula(g);
      if (nickAlinmis(g.ad)) throw new VeriHatasi("Bu nick kullanılıyor");
      const k: Karakter = {
        id: yeniId(b.depo, "c"), profileId: null, ad: g.ad.trim(), sinif: g.sinif, irkTuru: g.irkTuru ?? null, level: g.level,
        reb: g.reb, rutbe: g.rutbe, durum: g.durum, anaKarakter: true, ekipmanGorunur: "klan", notlar: g.notlar ?? null,
        katilmaTarihi: simdiIso().slice(0, 10), guncellendiAt: simdiIso(),
      };
      b.depo.karakterler.push(k);
      return { ...k };
    },
    async karakterGuncelle(id, g) {
      demoYetki(b, "yetkili");
      const eski = bul(id);
      if (!eski) throw new VeriHatasi("Karakter bulunamadı");
      karakterGirdisiDogrula({ ...g, level: g.level === undefined ? eski.level : g.level });
      if (g.ad !== undefined && nickAlinmis(g.ad, id)) throw new VeriHatasi("Bu nick kullanılıyor");
      return demoKaydet(b, eski, { ...eski, ...g, ad: g.ad?.trim() ?? eski.ad });
    },
    async profilGuncelle(g) {
      demoYetki(b, "uye");
      const eski = b.depo.karakterler.find((k) => k.profileId === b.kullaniciId && k.anaKarakter);
      if (!eski) throw new VeriHatasi("Hesabına bağlı karakter yok");
      const { level, reb } = profilKurallari(b.depo.ayarlar, eski, g);
      if (g.tsNick !== undefined) {
        const p = b.depo.profiller.find((x) => x.id === b.kullaniciId)!;
        p.tsNick = g.tsNick?.trim().slice(0, 30) || null;
      }
      return demoKaydet(b, eski, { ...eski, sinif: g.sinif ?? eski.sinif, level, reb, ekipmanGorunur: g.ekipmanGorunur ?? eski.ekipmanGorunur });
    },
  };
}

// --- Supabase ---

export function supabaseUyeler(db: Db): UyeVerisi {
  const satir = (k: Partial<KarakterGirdisi>) => ({
    ...(k.ad !== undefined && { ad: k.ad.trim() }),
    ...(k.sinif !== undefined && { sinif: k.sinif }),
    ...(k.irkTuru !== undefined && { irk_turu: k.irkTuru }),
    ...(k.level !== undefined && { level: k.level }),
    ...(k.reb !== undefined && { reb: k.reb }),
    ...(k.rutbe !== undefined && { rutbe: k.rutbe }),
    ...(k.durum !== undefined && { durum: k.durum }),
    ...(k.notlar !== undefined && { notlar: k.notlar }),
  });
  return {
    async profiller() { return (await sorgu(db.from("profiles").select("*"))).map(profil); },
    async karakterler() { return (await sorgu(db.from("characters").select("*").order("ad"))).map(karakter); },
    async karakter(id) {
      const r = await belki(db.from("characters").select("*").eq("id", id).maybeSingle());
      return r ? karakter(r) : null;
    },
    async degisiklikler(characterId) {
      const r = await sorgu(db.from("character_changes").select("*").eq("character_id", characterId).order("created_at", { ascending: false }));
      return r.map(degisiklik);
    },
    async karakterEkle(g) {
      karakterGirdisiDogrula(g);
      return karakter(await sorgu(db.from("characters").insert({ ...satir(g), ad: g.ad.trim() }).select().single()));
    },
    async karakterGuncelle(id, g) {
      karakterGirdisiDogrula(g);
      const r = await belki(db.from("characters").update(satir(g)).eq("id", id).select().maybeSingle());
      if (!r) throw new VeriHatasi("Bu işlem için yetkin yok");
      return karakter(r);
    },
    async profilGuncelle(g) {
      if (g.tsNick !== undefined) {
        const { data } = await db.auth.getUser();
        await calistir(db.from("profiles").update({ ts_nick: g.tsNick?.trim().slice(0, 30) || null }).eq("id", data.user?.id ?? ""));
      }
      const r = await sorgu(db.rpc("profil_guncelle", {
        p_sinif: g.sinif, p_level: g.level, p_reb: g.reb, p_ekipman_gorunur: g.ekipmanGorunur,
      }));
      return karakter(r);
    },
  };
}
