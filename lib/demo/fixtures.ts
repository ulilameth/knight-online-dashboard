// Demo modunun örnek verisi (design/prototype.html ile aynı klan). Supabase olmadan her ekran bu veriyle çalışır.
// Demo hesaplarının şifresi: DEMO_SIFRE. Demo davet kodu: DEMO_DAVET_KODU.
import type { KuralSatiri } from "@/lib/rules/kurallar";
import { tsi } from "@/lib/time";
import type {
  Asama, Build, Duyuru, Etkinlik, EtkinlikTuru, HaftalikDuzen, Hazirlik, IrkStatlari, Karakter, KarakterDurum, KlanAyarlari,
  Profil, Rutbe, Sinif, Yetki, YoklamaDurumu, Yoklama,
} from "@/lib/types";

export const DEMO_SIFRE = "demo1234";
export const DEMO_DAVET_KODU = "L4BEL-DEMO-2026";
const KAYNAK = "https://www.nttgame.com/knight/tr/newserveropen2026/";

export const ayarlar: KlanAyarlari = {
  klanAdi: "L4BEL",
  yedekAd: null,
  monogram: "L4",
  irk: "karus",
  sunucuAdi: null,
  tsAdres: "L4B",
  acilisAt: tsi("2026-11-12T16:00"),
  levelSiniri: 80,
  rebSiniri: 0,
};

export const asamalar: Asama[] = [
  { id: 1, sira: 1, baslik: "1. Ön kayıt", baslangic: tsi("2026-10-15"), bitis: tsi("2026-10-29"), saatBelli: false, aciklama: "Ödüllü dönem. Telefon doğrulaması gerekli.", kaynakUrl: KAYNAK },
  { id: 2, sira: 2, baslik: "2. Ön kayıt ve sunucu seçimi", baslangic: tsi("2026-10-29"), bitis: tsi("2026-11-10"), saatBelli: false, aciklama: "Bitiş bazı kaynaklarda 12 Kasım.", kaynakUrl: KAYNAK },
  { id: 3, sira: 3, baslik: "Karakter oluşturma", baslangic: tsi("2026-11-10"), bitis: tsi("2026-11-12T16:00"), saatBelli: false, aciklama: "Nick’ler ilk saatlerde alınmalı.", kaynakUrl: KAYNAK },
  { id: 4, sira: 4, baslik: "Sunucu açılışı", baslangic: tsi("2026-11-12T16:00"), bitis: null, saatBelli: true, aciklama: "Lider L4BEL klanını ilk gün kurar. Savaş yalnızca Ronark Land (CZ)’de.", kaynakUrl: KAYNAK },
];

export const etkinlikTurleri: EtkinlikTuru[] = [
  { kod: "csw", ad: "Castle Siege War", kisaAd: "CSW", yoklamaVar: true },
  { kod: "bdw", ad: "Border Defence War", kisaAd: "BDW", yoklamaVar: true },
  { kod: "juraid", ad: "Juraid Mountain", kisaAd: "Juraid", yoklamaVar: true },
  { kod: "chaos", ad: "Chaos", kisaAd: "Chaos", yoklamaVar: true },
  { kod: "ft", ad: "Forgotten Temple", kisaAd: "FT", yoklamaVar: true },
  { kod: "boss", ad: "Klan boss avı", kisaAd: "Boss", yoklamaVar: true },
  { kod: "toplanti", ad: "Klan toplantısı", kisaAd: "Toplantı", yoklamaVar: true },
];

// [nick, ts nick, sınıf, rütbe, level, katılım eğilimi, durum, hazırlık (otp, ön kayıt, sunucu, nick)]
const UYELER: [string, string, Sinif, Rutbe, number, number, KarakterDurum, [number, number, number, number]][] = [
  ["KaraBey", "karabey", "warrior", "lider", 76, 0.96, "aktif", [1, 1, 1, 1]],
  ["Asena", "asena.ko", "priest", "asistan", 74, 0.92, "aktif", [1, 1, 1, 1]],
  ["SessizOk", "sessizok", "rogue", "asistan", 75, 0.88, "aktif", [1, 1, 1, 0]],
  ["DemirYumruk", "demiryumruk", "warrior", "subay", 73, 0.9, "aktif", [1, 1, 0, 0]],
  ["AlevBüyü", "alevbuyu", "mage", "subay", 72, 0.84, "aktif", [1, 1, 1, 0]],
  ["ŞifaEli", "sifaeli", "priest", "subay", 71, 0.86, "aktif", [1, 0, 0, 0]],
  ["Bozkurt", "bozkurt44", "warrior", "uye", 70, 0.79, "aktif", [1, 1, 0, 0]],
  ["GeceKuşu", "gecekusu", "rogue", "uye", 71, 0.75, "aktif", [1, 0, 0, 0]],
  ["BuzKraliçe", "buzkralice", "mage", "uye", 69, 0.81, "aktif", [1, 1, 0, 0]],
  ["Tufan", "tufan", "kurian", "uye", 68, 0.7, "aktif", [1, 0, 0, 0]],
  ["Kartal", "kartal.ko", "rogue", "uye", 70, 0.66, "aktif", [1, 0, 0, 0]],
  ["Yıldırım", "yildirim", "mage", "uye", 67, 0.62, "aktif", [0, 0, 0, 0]],
  ["Bilge", "bilge", "priest", "uye", 66, 0.77, "aktif", [0, 0, 0, 0]],
  ["KılıçUstası", "kilicustasi", "warrior", "uye", 69, 0.58, "aktif", [0, 0, 0, 0]],
  ["Gölge", "golge", "rogue", "uye", 64, 0.38, "pasif", [0, 0, 0, 0]],
  ["Sancaktar", "sancaktar", "warrior", "uye", 65, 0.52, "izinli", [0, 0, 0, 0]],
  ["Ayaz", "ayaz", "kurian", "aday", 58, 0.45, "aktif", [0, 0, 0, 0]],
  ["Nur", "nur.priest", "priest", "aday", 55, 0.5, "aktif", [0, 0, 0, 0]],
];

/** Rütbeden yetki: lider ve asistanlar yönetici, subaylar yetkili */
const YETKI: Record<Rutbe, Yetki> = { lider: "yonetici", asistan: "yonetici", subay: "yetkili", uye: "uye", aday: "uye" };
const IRK: Record<Sinif, string> = { warrior: "arch_tuarek", rogue: "tuarek", mage: "wrinkle_tuarek", priest: "tuarek", kurian: "kurian" };

export const kimlik = (nick: string) =>
  nick.toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[^a-z0-9]/g, "");
export const profilId = (nick: string) => `p-${kimlik(nick)}`;
export const karakterId = (nick: string) => `c-${kimlik(nick)}`;

export const profiller: Profil[] = UYELER.map(([ad, ts, , rutbe]) => ({ id: profilId(ad), tsNick: ts, yetki: YETKI[rutbe], sonGiris: null }));

export const karakterler: Karakter[] = UYELER.map(([ad, , sinif, rutbe, level, , durum], i) => ({
  id: karakterId(ad),
  profileId: profilId(ad),
  ad,
  sinif,
  irkTuru: IRK[sinif],
  level,
  reb: 0,
  rutbe,
  durum,
  anaKarakter: true,
  ekipmanGorunur: ad === "Asena" ? "gizli" : "klan",
  notlar: null,
  katilmaTarihi: `2026-09-${String(20 + (i % 9)).padStart(2, "0")}`,
  guncellendiAt: tsi("2026-10-03T21:00"),
}));

export const hazirliklar: Hazirlik[] = UYELER.map(([ad, , , , , , , h]) => ({
  profileId: profilId(ad),
  otp: !!h[0],
  onKayit: !!h[1],
  sunucuSecimi: !!h[2],
  karakterAdi: !!h[3],
  klanaKatildi: false,
}));

export const haftalikDuzen: HaftalikDuzen[] = [
  { id: "hd-1", tur: "bdw", baslik: "Border Defence War", gun: 1, saat: "21:00", sureDk: 60, aktif: true },
  { id: "hd-2", tur: "juraid", baslik: "Juraid Mountain", gun: 2, saat: "21:30", sureDk: 60, aktif: true },
  { id: "hd-3", tur: "chaos", baslik: "Chaos", gun: 3, saat: "22:00", sureDk: 45, aktif: true },
  { id: "hd-4", tur: "boss", baslik: "Klan boss avı", gun: 4, saat: "21:00", sureDk: 60, aktif: true },
  { id: "hd-5", tur: "ft", baslik: "Forgotten Temple", gun: 5, saat: "21:00", sureDk: 60, aktif: true },
  { id: "hd-6", tur: "bdw", baslik: "Border Defence War", gun: 6, saat: "21:00", sureDk: 60, aktif: true },
  { id: "hd-0", tur: "csw", baslik: "Castle Siege War", gun: 0, saat: "20:30", sureDk: 90, aktif: true },
];

const ACIKLAMA: Record<string, string> = {
  csw: "Haftalık kale kuşatması. Kadro bir gün önce duyurulur; herkes 20:15’te toplanır.",
  bdw: "Sınır savunma savaşı. Parti listesi panelde, toplanma TeamSpeak’te.",
  juraid: "Juraid Mountain. 8 kişilik iki parti.",
  chaos: "Chaos dungeon. Katılım serbest, puanlar klan için.",
  ft: "Forgotten Temple. Priest’ler parti başına ikişer.",
  boss: "Klan boss avı. Drop’lar duyuruda paylaşılır.",
};

const toplanti = (id: string, baslik: string, an: string, aciklama: string): Etkinlik =>
  ({ id, tur: "toplanti", baslik, baslangic: tsi(an), bitis: null, aciklama, scheduleId: null, olusturan: profilId("KaraBey") });

/** Açılış öncesi toplantılar + açılıştan sonraki üç haftanın haftalık etkinlikleri */
export const etkinlikler: Etkinlik[] = [
  toplanti("e-kurulus", "Klan kuruluş toplantısı", "2026-09-28T21:00", "TeamSpeak (L4B). Rütbeler ve açılış hedefleri konuşuldu."),
  toplanti("e-sinif", "Sınıf dağılımı görüşmesi", "2026-10-02T21:30", "Kim hangi sınıfı açacak, hangi roller açıkta."),
  toplanti("e-otp", "OTP ve ön kayıt kontrolü", "2026-10-11T21:00", "Herkes telefon doğrulaması ve OTP durumunu panelde işaretlesin."),
  toplanti("e-onkayit", "Ön kayıt son çağrı", "2026-10-25T21:00", "Ön kaydı yapmayanlar için hatırlatma."),
  toplanti("e-oylama", "Sunucu oylaması", "2026-11-01T21:00", "Klanın gideceği sunucu oylanır; herkes aynı sunucuyu seçer."),
  toplanti("e-acilis", "Açılış toplanması", "2026-11-12T15:30", "TeamSpeak’te (L4B), açılıştan 30 dakika önce."),
];
for (let t = Date.parse(tsi("2026-11-13")); t <= Date.parse(tsi("2026-12-06")); t += 86_400_000) {
  const gun = tsiGunuMetni(t);
  const d = haftalikDuzen.find((x) => x.gun === new Date(t + 3 * 3_600_000).getUTCDay())!;
  etkinlikler.push({
    id: `e-${gun}`, tur: d.tur, baslik: d.baslik, baslangic: tsi(`${gun}T${d.saat}`), bitis: null,
    aciklama: ACIKLAMA[d.tur] ?? null, scheduleId: d.id, olusturan: profilId("DemirYumruk"),
  });
}
function tsiGunuMetni(utcGeceYarisi: number) {
  return new Date(utcGeceYarisi + 3 * 3_600_000).toISOString().slice(0, 10);
}

/** Prototipteki gibi tekrarlanabilir rastgelelik: aynı etkinlik + üye her zaman aynı sonucu verir */
function ozet(s: string) {
  let h = 2166136261;
  for (const c of s) { h ^= c.codePointAt(0)!; h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rastgele(tohum: number) {
  let t = (tohum + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Verilen andan önceki etkinliklerin yoklaması (katılım eğilimine göre) */
export function yoklamalar(su: Date): Yoklama[] {
  const sonuc: Yoklama[] = [];
  for (const e of etkinlikler) {
    if (Date.parse(e.baslangic) > su.getTime()) continue;
    for (const [ad, , , , , egilim] of UYELER) {
      const r = rastgele(ozet(`${e.id}:${ad}`));
      const p = e.tur === "toplanti" ? Math.min(0.97, egilim + 0.06) : egilim;
      const durum: YoklamaDurumu = r < p ? (r < p * 0.1 ? "gec" : "katildi") : r < p + (1 - p) * 0.35 ? "mazeretli" : "yok";
      sonuc.push({ eventId: e.id, characterId: karakterId(ad), durum, isaretleyen: profilId("DemirYumruk"), updatedAt: e.baslangic });
    }
  }
  return sonuc;
}

const duyuru = (id: string, baslik: string, yazar: string, an: string, sabit: boolean, ts: boolean, govde: string): Duyuru =>
  ({ id, baslik, govde, sabit, tsGonderildiAt: ts ? tsi(an) : null, yazar: profilId(yazar), createdAt: tsi(an) });

export const duyurular: Duyuru[] = [
  duyuru("d-plan", "Açılış planı", "KaraBey", "2026-10-03T19:10", true, true, "Bu hafta herkes telefon doğrulamasını ve OTP’yi açsın; yeni sunuculara OTP olmadan girilemiyor. Ön kayıt 15 Ekim’de başlıyor ve ilk dönem ödüllü."),
  duyuru("d-sinif", "Sınıf dağılımı", "Asena", "2026-10-02T23:05", false, true, "Şu an 5 Warrior, 4 Rogue, 3 Mage, 4 Priest, 2 Kurian var. Mage ve Kurian açığımız var; kararsız kalanlar kanala yazsın."),
  duyuru("d-ardream", "Yeni sunucularda Ardream yok", "SessizOk", "2026-10-01T18:40", false, false, "Ardream ve Ronark Land Base haritaları olmayacak, tüm savaş Ronark Land (CZ)’de. Level planınızı buna göre yapın."),
  duyuru("d-csw", "Pazar CSW kadrosu", "KaraBey", "2026-11-20T22:15", true, true, "İlk iki parti belli, liste panelde. Herkes 20:15’te Ronark Land (CZ) girişinde. Mazereti olan cumartesi akşamına kadar panelden bildirsin."),
  duyuru("d-boss", "Boss avı saati", "DemirYumruk", "2026-11-18T12:30", false, true, "Perşembe boss avı 21:00’de kalıyor. Drop dağılımı avdan sonra duyurulacak."),
  duyuru("d-juraid", "Juraid partileri", "Asena", "2026-11-16T20:00", false, false, "Juraid için 8 kişilik iki parti kuruyoruz; Priest sayısı az, Bilge ve Nur ikinci partide."),
];

const build = (nick: string, sinif: Sinif, level: number, statlar: Partial<Build["statlar"]>, ekipman: Record<number, number>, an: string): Build => ({
  id: `b-${kimlik(nick)}`,
  characterId: karakterId(nick),
  ad: "Build",
  sinif,
  irkTuru: IRK[sinif],
  level,
  reb: 0,
  statlar: { str: 0, hp: 0, dex: 0, int: 0, mp: 0, ...statlar },
  skiller: [0, 0, 0, 0],
  ekipman: Object.fromEntries(Object.entries(ekipman).map(([yuva, itemId]) => [yuva, { itemId, arti: 7 }])),
  apGirdileri: {},
  sablon: false,
  updatedAt: tsi(an),
});

/** Kayıtlı build'ler (Üyeler › Ekipman). Eşya kimlikleri design/katalog.json'daki KO Bugda kimlikleri. */
export const buildler: Build[] = [
  build("KaraBey", "warrior", 76, { str: 180, hp: 87 }, { 0: 262, 2: 126, 3: 128, 4: 127, 5: 125, 6: 124 }, "2026-10-03T21:10"),
  build("SessizOk", "rogue", 75, { str: 60, hp: 22, dex: 180 }, { 0: 263, 2: 323, 3: 325, 4: 324, 5: 322, 6: 321 }, "2026-10-04T19:45"),
  build("AlevBüyü", "mage", 72, { int: 185, mp: 62 }, { 0: 549, 2: 333, 3: 335, 4: 334, 5: 332, 6: 331 }, "2026-10-02T22:30"),
  build("Asena", "priest", 74, { str: 150, hp: 50, mp: 57 }, { 2: 328, 3: 330, 4: 329, 5: 327, 6: 326 }, "2026-10-01T20:05"),
];

// --- Karakter tasarımı kuralları: supabase/migrations/0001_init.sql seed'iyle aynı (supabase/tests/katalog.test.ts denetler) ---

export const oyunKuralSatirlari: KuralSatiri[] = [
  { anahtar: "olusturma_bonus_stat", deger: 10, dogrulandi: true },
  { anahtar: "stat_per_level", deger: 3, dogrulandi: true },
  { anahtar: "stat_per_level_60_ustu", deger: 5, dogrulandi: true },
  { anahtar: "reb_bonus_stat", deger: 2, dogrulandi: true },
  { anahtar: "stat_cap", deger: 255, dogrulandi: true },
  { anahtar: "skill_start_level", deger: 10, dogrulandi: true },
  { anahtar: "skill_per_level", deger: 2, dogrulandi: true },
  { anahtar: "agac_siniri", deger: { genel: 80, warrior_3: 83 }, dogrulandi: true },
  { anahtar: "master_level", deger: 60, dogrulandi: false },
  { anahtar: "master_max", deger: 23, dogrulandi: false },
];

const irk = (irkTuru: string, ad: string, taraf: IrkStatlari["taraf"], siniflar: Sinif[], [str, hp, dex, int, mp]: number[]): IrkStatlari =>
  ({ irkTuru, ad, taraf, siniflar, statlar: { str, hp, dex, int, mp }, dogrulandi: true });

export const irklar: IrkStatlari[] = [
  irk("arch_tuarek", "Arch Tuarek", "karus", ["warrior"], [65, 65, 60, 50, 50]),
  irk("tuarek", "Tuarek", "karus", ["rogue", "priest"], [60, 60, 70, 50, 50]),
  irk("wrinkle_tuarek", "Wrinkle Tuarek", "karus", ["mage"], [50, 50, 70, 70, 50]),
  irk("puri_tuarek", "Puri Tuarek", "karus", ["mage", "priest"], [50, 60, 60, 70, 50]),
  irk("kurian", "Kurian", "karus", ["kurian"], [65, 65, 60, 50, 50]),
  irk("barbarian", "Barbarian", "el_morad", ["warrior"], [65, 65, 60, 50, 50]),
  irk("el_morad_erkek", "El Moradian (erkek)", "el_morad", ["warrior", "rogue", "mage", "priest"], [60, 60, 70, 50, 50]),
  irk("el_morad_kadin", "El Moradian (kadın)", "el_morad", ["warrior", "rogue", "mage", "priest"], [50, 60, 60, 70, 50]),
  irk("porutu", "Porutu", "el_morad", ["kurian"], [65, 65, 60, 50, 50]),
];

/** class_trees: 3 ağaç + master */
export const agaclar: Record<Sinif, string[]> = {
  warrior: ["Attack", "Defense", "Passion", "Master"],
  rogue: ["Archery", "Assassin", "Explore", "Master"],
  mage: ["Flame", "Glacier", "Lightning", "Master"],
  priest: ["Heal", "Buff", "Debuff", "Master"],
  kurian: ["Attack", "Defense", "Devil", "Master"],
};
