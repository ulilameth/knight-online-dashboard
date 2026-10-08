// Panelin alan tipleri. Veritabanı sütunları snake_case (supabase/migrations/0001_init.sql), burada camelCase.
// Tarihler ISO metni: sunucu bileşenlerinden istemciye olduğu gibi geçer.

export type Yetki = "uye" | "yetkili" | "yonetici";
export const YETKI_SIRASI: readonly Yetki[] = ["uye", "yetkili", "yonetici"];
export const yetkiYeterli = (yetki: Yetki, enAz: Yetki) => YETKI_SIRASI.indexOf(yetki) >= YETKI_SIRASI.indexOf(enAz);

export type Sinif = "warrior" | "rogue" | "mage" | "priest" | "kurian";
export type Rutbe = "lider" | "asistan" | "subay" | "uye" | "aday";
export type KarakterDurum = "aktif" | "izinli" | "pasif" | "ayrildi";
export type YoklamaDurumu = "katildi" | "gec" | "mazeretli" | "yok";
export type Taraf = "karus" | "el_morad";
export type Gorunurluk = "klan" | "gizli";

export interface Profil {
  id: string;
  tsNick: string | null;
  yetki: Yetki;
  sonGiris: string | null;
}

export interface Karakter {
  id: string;
  profileId: string | null;
  ad: string;
  sinif: Sinif | null;
  irkTuru: string | null;
  level: number | null;
  reb: number;
  rutbe: Rutbe;
  durum: KarakterDurum;
  anaKarakter: boolean;
  ekipmanGorunur: Gorunurluk;
  notlar: string | null;
  katilmaTarihi: string;
  guncellendiAt: string;
}

export interface KarakterDegisikligi {
  id: number;
  characterId: string;
  alan: string;
  eski: string | null;
  yeni: string | null;
  degistiren: string | null;
  createdAt: string;
}

/** Oturumdaki kullanıcı: hesap ve ana karakteri (kayıt yarım kaldıysa karakter yok olabilir) */
export interface Kullanici {
  profil: Profil;
  karakter: Karakter | null;
}

export interface KlanAyarlari {
  klanAdi: string;
  yedekAd: string | null;
  monogram: string;
  irk: Taraf;
  sunucuAdi: string | null;
  tsAdres: string;
  acilisAt: string;
  levelSiniri: 80 | 83;
  rebSiniri: number;
}

export interface Asama {
  id: number;
  sira: number;
  baslik: string;
  baslangic: string;
  bitis: string | null;
  saatBelli: boolean;
  aciklama: string | null;
  kaynakUrl: string | null;
}

export interface EtkinlikTuru {
  kod: string;
  ad: string;
  kisaAd: string;
  yoklamaVar: boolean;
}

export interface Etkinlik {
  id: string;
  tur: string;
  baslik: string;
  baslangic: string;
  bitis: string | null;
  aciklama: string | null;
  scheduleId: string | null;
  olusturan: string | null;
}

export interface Yoklama {
  eventId: string;
  characterId: string;
  durum: YoklamaDurumu;
  isaretleyen: string | null;
  updatedAt: string;
}

export interface HaftalikDuzen {
  id: string;
  tur: string;
  baslik: string;
  /** 0 pazar … 6 cumartesi */
  gun: number;
  /** "21:00", TSİ */
  saat: string;
  sureDk: number;
  aktif: boolean;
}

export interface Duyuru {
  id: string;
  baslik: string;
  govde: string;
  sabit: boolean;
  tsGonderildiAt: string | null;
  yazar: string | null;
  createdAt: string;
}

export interface Hazirlik {
  profileId: string;
  otp: boolean;
  onKayit: boolean;
  sunucuSecimi: boolean;
  karakterAdi: boolean;
  klanaKatildi: boolean;
}

export interface DavetKodu {
  id: string;
  sonDort: string;
  rutbe: Extract<Rutbe, "uye" | "aday">;
  maxKullanim: number;
  kullanim: number;
  bitis: string;
  aktif: boolean;
  aciklama: string | null;
  olusturan: string | null;
  createdAt: string;
}

export type StatAdi = "str" | "hp" | "dex" | "int" | "mp";

export interface Irk {
  irkTuru: string;
  ad: string;
  taraf: Taraf;
  siniflar: Sinif[];
  statlar: Record<StatAdi, number>;
}

export interface Build {
  id: string;
  characterId: string | null;
  ad: string;
  sinif: Sinif;
  irkTuru: string | null;
  level: number;
  reb: number;
  statlar: Record<StatAdi, number>;
  /** 3 ağaç + master */
  skiller: [number, number, number, number];
  /** yuva sırası → takılı eşya */
  ekipman: Record<string, { itemId: number; arti: number }>;
  apGirdileri: Record<string, unknown>;
  sablon: boolean;
  updatedAt: string;
}
