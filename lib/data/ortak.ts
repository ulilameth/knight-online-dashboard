// Veri katmanının ortak parçaları: bağlamlar, hata, demo yetki denetimi, satır dönüştürücüleri.
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/database.types";
import type { DemoDepo } from "@/lib/demo/depo";
import {
  type Asama, type Build, type DavetKodu, type Duyuru, type Esya, type EsyaSeti, type Etkinlik, type EtkinlikTuru,
  type HaftalikDuzen, type Hazirlik, type IrkStatlari, type Karakter, type KarakterDegisikligi, type KlanAyarlari,
  type Profil, type SetBonusSatiri, type Yetki, type Yoklama,
  yetkiYeterli,
} from "@/lib/types";

export type Db = SupabaseClient<Database>;

/** Demo adaptörleri: depo + işlemi yapan kullanıcının profil kimliği (oturum yoksa null) */
export interface DemoBaglam {
  depo: DemoDepo;
  kullaniciId: string | null;
}

/** Kullanıcıya gösterilebilen hata (Türkçe). Beklenmeyen hatalar Error olarak kalır. */
export class VeriHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "VeriHatasi";
  }
}

export const YETKI_YOK = "Bu işlem için yetkin yok";

/** Supabase hatasını VeriHatasi'na çevirir: RLS ve izin hataları tek mesaj, veritabanının Türkçe mesajları olduğu gibi */
export function supabaseHatasi(hata: PostgrestError | null): void {
  if (!hata) return;
  if (hata.code === "42501" || /row-level security|permission denied/i.test(hata.message)) throw new VeriHatasi(YETKI_YOK);
  // Postgres'in kendi kısıt mesajları İngilizce; migration'daki fonksiyonların mesajları Türkçe ve olduğu gibi gösterilir
  if (hata.code === "23505") throw new VeriHatasi(/characters_ad_key/.test(hata.message) ? "Bu nick kullanılıyor" : hata.message.startsWith("duplicate key") ? "Bu kayıt zaten var" : hata.message);
  if (hata.code === "23514") throw new VeriHatasi(/violates check constraint/.test(hata.message) ? "Girilen değerler kurallara uymuyor" : hata.message);
  if (hata.code === "P0001") throw new VeriHatasi(hata.message);
  throw new Error(hata.message);
}

type Yanit = { data: unknown; error: PostgrestError | null };

/** Supabase sorgusunu çalıştırır, hatayı çevirir, veriyi döner (veri gelmezse hata) */
export async function sorgu<R extends Yanit>(istek: PromiseLike<R>): Promise<NonNullable<R["data"]>> {
  const { data, error } = await istek;
  supabaseHatasi(error);
  if (data === null || data === undefined) throw new Error("Sorgu veri döndürmedi");
  return data as NonNullable<R["data"]>;
}

/** Tek satırlık sorgu (maybeSingle): satır yoksa null */
export async function belki<R extends Yanit>(istek: PromiseLike<R>): Promise<R["data"]> {
  const { data, error } = await istek;
  supabaseHatasi(error);
  return data;
}

/** Veri dönmeyen yazma ya da fonksiyon çağrısı */
export async function calistir(istek: PromiseLike<{ error: PostgrestError | null }>): Promise<void> {
  const { error } = await istek;
  supabaseHatasi(error);
}

/** Demo'da RLS'in yerine: işlemi yapan kullanıcının yetkisi */
export function demoYetki(b: DemoBaglam, enAz: Yetki): Profil {
  const p = b.depo.profiller.find((x) => x.id === b.kullaniciId);
  if (!p || !yetkiYeterli(p.yetki, enAz)) throw new VeriHatasi(YETKI_YOK);
  return p;
}

export const simdiIso = () => new Date().toISOString();

// --- Satır dönüştürücüleri (snake_case → camelCase) ---

export const profil = (r: Tables<"profiles">): Profil => ({ id: r.id, tsNick: r.ts_nick, yetki: r.yetki, sonGiris: r.son_giris });

export const karakter = (r: Tables<"characters">): Karakter => ({
  id: r.id, profileId: r.profile_id, ad: r.ad, sinif: r.sinif, irkTuru: r.irk_turu, level: r.level, reb: r.reb,
  rutbe: r.rutbe, durum: r.durum, anaKarakter: r.ana_karakter, ekipmanGorunur: r.ekipman_gorunur, notlar: r.notlar,
  katilmaTarihi: r.katilma_tarihi, guncellendiAt: r.guncellendi_at,
});

export const degisiklik = (r: Tables<"character_changes">): KarakterDegisikligi => ({
  id: r.id, characterId: r.character_id, alan: r.alan, eski: r.eski, yeni: r.yeni, degistiren: r.degistiren, createdAt: r.created_at,
});

export const ayarlar = (r: Tables<"clan_settings">): KlanAyarlari => ({
  klanAdi: r.klan_adi, yedekAd: r.yedek_ad, monogram: r.monogram, irk: r.irk, sunucuAdi: r.sunucu_adi, tsAdres: r.ts_adres,
  acilisAt: r.acilis_at, levelSiniri: r.level_siniri as 80 | 83, rebSiniri: r.reb_siniri,
});

export const asama = (r: Tables<"milestones">): Asama => ({
  id: r.id, sira: r.sira, baslik: r.baslik, baslangic: r.baslangic, bitis: r.bitis, saatBelli: r.saat_belli,
  aciklama: r.aciklama, kaynakUrl: r.kaynak_url,
});

export const etkinlikTuru = (r: Tables<"event_types">): EtkinlikTuru => ({ kod: r.kod, ad: r.ad, kisaAd: r.kisa_ad, yoklamaVar: r.yoklama_var });

export const etkinlik = (r: Tables<"events">): Etkinlik => ({
  id: r.id, tur: r.tur, baslik: r.baslik, baslangic: r.baslangic, bitis: r.bitis, aciklama: r.aciklama,
  scheduleId: r.schedule_id, olusturan: r.olusturan,
});

export const yoklama = (r: Tables<"attendance">): Yoklama => ({
  eventId: r.event_id, characterId: r.character_id, durum: r.durum, isaretleyen: r.isaretleyen, updatedAt: r.updated_at,
});

export const duzen = (r: Tables<"recurring_schedules">): HaftalikDuzen => ({
  id: r.id, tur: r.tur, baslik: r.baslik, gun: r.gun, saat: r.saat.slice(0, 5), sureDk: r.sure_dk, aktif: r.aktif,
});

export const duyuru = (r: Tables<"announcements">): Duyuru => ({
  id: r.id, baslik: r.baslik, govde: r.govde, sabit: r.sabit, tsGonderildiAt: r.ts_gonderildi_at, yazar: r.yazar, createdAt: r.created_at,
});

export const hazirlik = (r: Tables<"hazirlik">): Hazirlik => ({
  profileId: r.profile_id, otp: r.otp, onKayit: r.on_kayit, sunucuSecimi: r.sunucu_secimi, karakterAdi: r.karakter_adi,
  klanaKatildi: r.klana_katildi,
});

export const davetKodu = (r: Tables<"invite_codes">): DavetKodu => ({
  id: r.id, sonDort: r.son_dort, rutbe: r.rutbe as DavetKodu["rutbe"], maxKullanim: r.max_kullanim, kullanim: r.kullanim,
  bitis: r.bitis, aktif: r.aktif, aciklama: r.aciklama, olusturan: r.olusturan, createdAt: r.created_at,
});

export const build = (r: Tables<"builds">): Build => ({
  id: r.id, characterId: r.character_id, ad: r.ad, sinif: r.sinif, irkTuru: r.irk_turu, level: r.level, reb: r.reb,
  statlar: r.statlar as Build["statlar"], skiller: r.skiller as Build["skiller"], ekipman: r.ekipman as Build["ekipman"],
  apGirdileri: r.ap_girdileri as Build["apGirdileri"], sablon: r.sablon, updatedAt: r.updated_at,
});

export const esya = (r: Tables<"items">): Esya => ({
  id: r.id, ad: r.ad, kategori: r.kategori, yuvalar: r.yuvalar, siniflar: r.siniflar, derece: r.derece,
  setAnahtari: r.set_anahtari, setParcasi: r.set_parcasi as Esya["setParcasi"], etki: r.etki, gorsel: r.gorsel, kaynak: r.kaynak,
});

export const esyaSeti = (r: Tables<"item_sets">): EsyaSeti => ({
  anahtar: r.anahtar, ad: r.ad, aile: r.aile, parcalar: r.parcalar, bonusTablosu: r.bonus_tablosu,
});

export const setBonusSatiri = (r: Tables<"item_set_bonuses">): SetBonusSatiri => ({ tablo: r.tablo, maske: r.maske, bonus: r.bonus as Record<string, number> });

export const irkStatlari = (r: Tables<"race_stats">): IrkStatlari => ({
  irkTuru: r.irk_turu, ad: r.ad, taraf: r.taraf, siniflar: r.siniflar,
  statlar: { str: r.str, hp: r.hp, dex: r.dex, int: r.int, mp: r.mp }, dogrulandi: r.dogrulandi,
});
