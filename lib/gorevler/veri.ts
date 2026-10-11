// Görevler ve level rehberi verisi: 1-80 rotası, kasma yerleri, etkinlikler, EXP bonusları, sınıf notları.
// Klanın kendi derlediği, kaynak gösterilen veri (bkz. reports/ "Knight Online 80 level görev rotası" araştırması).
// Görev, NPC, mob, eşya ve bölge adları oyundaki İngilizce halleriyle; açıklamalar Türkçe.
// kobugda.com/quests listesi içe aktarılmadı (robots.txt /api/'yi kapatıyor, AI politikası toplu kopyayı yasaklıyor); yalnızca link verilir.
// Değerler eski sunuculardaki rehber verisidir; 12 Kasım 2026 sunucularında oyunda doğrulanmalı.

export type Kanit = "confirmed_2026" | "existing_servers" | "precedent_2022" | "precedent_older" | "community";

export interface Kaynak {
  baslik: string;
  url: string;
  tarih: string;
  kanit: Kanit;
}

export const KAYNAKLAR = {
  korehberiDb: { baslik: "KO Rehberi – görev veritabanı", url: "https://korehberi.com/knight-online/gorevler", tarih: "2022-02", kanit: "precedent_2022" },
  rehber183: { baslik: "KO Rehber – Leveling guide 1–83", url: "https://knightonlinerehber.net/en/guides/knight-online-leveling-guide-1-83", tarih: "2026-09", kanit: "existing_servers" },
  rehberBaslangic: { baslik: "KO Rehber – Beginner's guide", url: "https://knightonlinerehber.net/en/guides/knight-online-beginners-guide", tarih: "2026-09", kanit: "existing_servers" },
  rehberEslant: { baslik: "KO Rehber – Eslant", url: "https://knightonlinerehber.net/en/guides/knight-online-eslant", tarih: "2026-09", kanit: "existing_servers" },
  rehberCz: { baslik: "KO Rehber – Ronark Land (CZ)", url: "https://knightonlinerehber.net/en/guides/knight-online-ronark-land-cz", tarih: "2026-09", kanit: "existing_servers" },
  rehberSpots: { baslik: "KO Rehber – Farming spots", url: "https://knightonlinerehber.net/en/guides/knight-online-farming-spots", tarih: "2026-09", kanit: "existing_servers" },
  rehber7Keys: { baslik: "KO Rehber – Guardian of 7 Keys", url: "https://knightonlinerehber.net/en/guides/usko-guardian-7-keys-level-60", tarih: "2026-09", kanit: "existing_servers" },
  rehberDaily: { baslik: "KO Rehber – Daily routine", url: "https://knightonlinerehber.net/en/guides/knight-online-daily-routine", tarih: "2026-09", kanit: "existing_servers" },
  rehberMaster: { baslik: "KO Rehber – Master skills (level 60)", url: "https://knightonlinerehber.net/en/guides/usko-master-skills-level-60-quest-materials", tarih: "2026-09", kanit: "existing_servers" },
  rehberSkill: { baslik: "KO Rehber – 70–80 skill quests", url: "https://knightonlinerehber.net/en/guides/knight-online-70-80-skill-quests", tarih: "2026-09", kanit: "existing_servers" },
  rehberJob: { baslik: "KO Rehber – 1st job change", url: "https://knightonlinerehber.net/en/guides/1st-job-change-level-10-skill-quest", tarih: "2026-09", kanit: "existing_servers" },
  rehberSinif: { baslik: "KO Rehber – Best class", url: "https://knightonlinerehber.net/en/guides/knight-online-best-class", tarih: "2026-09", kanit: "existing_servers" },
  rehberYeni: { baslik: "KO Rehber – Yeni sunucular: Ardream ve RLB yok", url: "https://knightonlinerehber.net/en/guides/knight-online-new-servers-no-ardream-ronark-land-base", tarih: "2026-10", kanit: "confirmed_2026" },
  kofarm183: { baslik: "KoFarmAnaliz – 1-83 level kasma rehberi", url: "https://www.kofarmanaliz.com/blog/knight-online-1-83-level-kasma-rehberi", tarih: "2026-09-01", kanit: "existing_servers" },
  kofarmExp: { baslik: "KoFarmAnaliz – EXP artırma yöntemleri", url: "https://www.kofarmanaliz.com/blog/knight-online-exp-artirma-yontemleri-rehberi", tarih: "2026", kanit: "existing_servers" },
  ucuzagbExp: { baslik: "UcuzaGB – EXP nasıl hızlı kasılır", url: "https://ucuzagb.com/rehber/exp-nasil-hizli-kasilir", tarih: "2026-08", kanit: "community" },
  steamChat: { baslik: "Steam KO TR – Chat görevleri rehberi", url: "https://steamcommunity.com/app/389430/discussions/3/412446292757153141/", tarih: "2016-02", kanit: "precedent_older" },
  gamesatisChat: { baslik: "GameSatış – Anahtar ve chat görevleri", url: "https://www.gamesatis.com/blog/knight-online-haberleri/knight-online-gorevler-anahtar-ve-chat-gorevleri-detaylari", tarih: "2021-06", kanit: "precedent_older" },
  korehberiPremium: { baslik: "KO Rehberi – Premium özellikleri", url: "https://korehberi.com/genel/knight-online-premium-ozellikleri", tarih: "2026", kanit: "existing_servers" },
  kopazarPremium: { baslik: "Kopazar – EXP Premium", url: "https://www.kopazar.com/en/knight-online-premium/exp-premium", tarih: "2026", kanit: "existing_servers" },
  korehberiEtkinlik: { baslik: "KO Rehberi – Etkinlik saatleri", url: "https://korehberi.com/knight-online/etkinlikler", tarih: "2026-01", kanit: "existing_servers" },
  mukmirOkcu: { baslik: "Mukmir – Detaylı okçu rehberi", url: "https://www.mukmir.com/2024/08/knight-online-detayl-okcu-rehberi.html", tarih: "2024-08", kanit: "community" },
  kopazarYeni: { baslik: "Kopazar – Yeni sunucular 12 Kasım 2026", url: "https://www.kopazar.com/blog/knight-online-yeni-sunuculari-12-kasim-2026-da-aciliyor", tarih: "2026-10", kanit: "confirmed_2026" },
} satisfies Record<string, Kaynak>;

export type KaynakId = keyof typeof KAYNAKLAR;

/** Oyuncular için ayrıntılı liste (içerik kopyalanmaz, yalnızca bağlantı) */
export const KOBUGDA_GOREVLER = "https://kobugda.com/quests";

export type AralikId = "1-10" | "10-20" | "20-35" | "35-45" | "45-50" | "50-60" | "60-70" | "70-75" | "75-80" | "80-83";

/** hemen: şimdi yap · ertele: sonraya bırak (ör. boss 78'de) · sakla: level sınırı 80 iken 83'e sakla · atla · istege */
export type Oneri = "hemen" | "ertele" | "sakla" | "atla" | "istege";
/** Yeni sunucuda: var · yok (ör. Ronark Land Base) · dogrula (oyunda kontrol et) */
export type YeniSunucu = "var" | "yok" | "dogrula";

export interface Gorev {
  id: string;
  /** Oyundaki İngilizce adı (birden çok görev " / " ile) */
  ad: string;
  /** Zincirin toplamı veriliyorsa */
  zincir?: boolean;
  aralik: AralikId;
  level: number;
  /** Görevi veren: tarafı belliyse karus/elmorad, değilse iki ad birlikte */
  npc: { karus: string; elmorad: string } | { ikisi: string };
  bolge: string;
  /** Ne yapılır (mob/eşya adları İngilizce) */
  hedef?: string;
  /** Toplam EXP (birden çok görevde toplam) */
  exp?: number;
  /** exp yoksa ya da aralıksa gösterilecek metin */
  expMetni?: string;
  /** Eşya/Noah ödülü (İngilizce eşya adları) */
  odul?: string;
  tekrar?: "gunluk" | "tekrar";
  parti?: "onerilir" | "zorunlu";
  oneri: Oneri;
  /** Neden bu öneri (Türkçe) */
  neden?: string;
  /** Job change / master gibi atlanamayanlar */
  zorunlu?: boolean;
  yeniSunucu?: YeniSunucu;
  /** Kaynaklar arasındaki çelişki (Türkçe) */
  celiski?: string;
  kaynaklar: KaynakId[];
}

const KB = "Kale (Luferson / El Morad Castle)";

export const GOREVLER: Gorev[] = [
  // --- 1-10 Moradon ---
  { id: "worm-hunt", ad: "Worm hunt", aralik: "1-10", level: 1, npc: { ikisi: "[Guard] Patrick" }, bolge: "Moradon (830,551)", hedef: "5 Worm", exp: 50, odul: "10 Holy Water, 5 Potion of Spirit, 2.000 Noah", oneri: "hemen", kaynaklar: ["rehberBaslangic", "korehberiDb"] },
  { id: "potrang", ad: "Get rid of the mice / Obtaining food", aralik: "1-10", level: 1, npc: { ikisi: "[Kurian] Potrang" }, bolge: "Moradon (805,551)", hedef: "5 Bandicoot; 2 Apple of Moradon", exp: 500, oneri: "hemen", kaynaklar: ["korehberiDb", "rehberBaslangic"] },
  { id: "trust", ad: "Kaishan's trust / Billbor's trust / Gaining trust", aralik: "1-10", level: 1, npc: { ikisi: "Moradon NPC'leri" }, bolge: "Moradon", hedef: "Billbor için limandaki Looters'tan Secret Account Book", exp: 45_000, expMetni: "3 × 15.000", oneri: "hemen", neden: "4. level barının ~44 katı; Kaishan's trust 24.07.2025'ten beri 1 Apple of Moradon istiyor", kaynaklar: ["korehberiDb", "kofarm183"] },
  { id: "suppression-1", ad: "Monster Suppression Squad (I)", aralik: "1-10", level: 5, npc: { ikisi: "[Mercenary Captain] Cougar" }, bolge: "Moradon (905,548), zindan (en fazla 9. level)", hedef: "Orc Bandit Boss Rabuma", odul: "5 Max HP + 5 Max MP Increase Potion", oneri: "hemen", kaynaklar: ["rehberBaslangic", "korehberiDb"] },
  { id: "patrick-1-10", ad: "Kecoon hunting / Bulcan hunting / Wild Bulcan hunting / Kekoon Warrior hunting", aralik: "1-10", level: 6, npc: { ikisi: "[Guard] Patrick" }, bolge: "Moradon A bölgesi", exp: 15_125, expMetni: "875 + 3.500 + 4.500 + 6.250", oneri: "hemen", neden: "Aynı bölgede: hepsini birlikte al, her av için şehre dönme", celiski: "Bulcan ve Wild Bulcan 24.07.2025'ten beri 6. level (eski rehberlerde 8-9)", kaynaklar: ["korehberiDb", "kofarm183"] },
  { id: "job-1", ad: "1st job change", aralik: "1-10", level: 10, npc: { ikisi: "[Grand Merchant] Kaishan" }, bolge: "Moradon (815,708)", odul: "Sınıf skilleri açılır", expMetni: "3.000 Noah", oneri: "hemen", zorunlu: true, kaynaklar: ["rehberJob", "kofarm183"] },
  // --- 10-20 Moradon B ---
  { id: "patrick-10-20", ad: "Subdual of Gavolt / Subdual of Vulture / Giant Bulcan Hunting / Werewolf elimination / Subdual of Silan", aralik: "10-20", level: 11, npc: { ikisi: "[Guard] Patrick" }, bolge: "Moradon B bölgesi (güney)", exp: 67_500, expMetni: "6.250 – 17.500 (11-17)", oneri: "hemen", neden: "Patrick'in avları sırayla gelir; birkaçını alıp tek turda bitir", kaynaklar: ["korehberiDb", "rehberBaslangic"] },
  { id: "discipline", ad: "Discipline", aralik: "10-20", level: 12, npc: { ikisi: "[Mercenary Captain] Cougar" }, bolge: "Moradon, zindan", hedef: "5 Certificate of Duel", exp: 10_000, odul: "30.000 Noah, düşük level pauldron +5", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "hepa-weapon", ad: "Low-level weapon production", aralik: "10-20", level: 16, npc: { ikisi: "[Blacksmith] Hepa" }, bolge: "Moradon (711,594)", odul: "Vulture / Horned silah", oneri: "hemen", neden: "Kesme hızını artıran görev silahı", kaynaklar: ["rehberBaslangic", "korehberiDb"] },
  { id: "patrick-19-20", ad: "Giant Gavolt hunting / Werewolf skin / Glyptodont hunt", aralik: "10-20", level: 19, npc: { ikisi: "[Guard] Patrick" }, bolge: "Moradon B bölgesi", exp: 172_500, expMetni: "47.500 + 75.000 + 50.000", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  // --- 20-35 Folk Village ---
  { id: "gemstone", ad: "Gemstone of Courage", aralik: "20-35", level: 21, npc: { ikisi: "[Mercenary Captain] Cougar" }, bolge: "Moradon, zindan", exp: 150_000, odul: "pauldron +6", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "patrick-22-23", ad: "Gloomwing hunt / Orc Watcher hunting", aralik: "20-35", level: 22, npc: { ikisi: "[Guard] Patrick" }, bolge: "Moradon", exp: 335_000, oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "battle-armor", ad: "Battle Armor 1–5", zincir: true, aralik: "20-35", level: 24, npc: { ikisi: "[Mercenary Adjutant] Lazi" }, bolge: "Folk Village (425,528)", hedef: "10 Spoiler, 5 Scorpion, 10 Lycan, 10 Lugaru, 10 Dark Eye", expMetni: "75 bin – 175 bin (adım başına, 24-28)", odul: "Battle Armor serisi", oneri: "hemen", neden: "Zırh ihtiyacını karşılar, pazardan alma", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "folk-construction", ad: "Folk Village Construction", aralik: "20-35", level: 24, npc: { ikisi: "[Mercenary Supply Officer] Osmond" }, bolge: "Folk Village (359,535)", exp: 125_000, oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "full-plate", ad: "Full Plate Armor 1–5", zincir: true, aralik: "20-35", level: 30, npc: { ikisi: "[Mercenary Adjutant] Lazi" }, bolge: "Folk Village", hedef: "10 Skeleton, 5 Paralyzer, 10 Dire Wolf, 5 Smilodon, 5 Wild Smilodon", expMetni: "250 bin – 550 bin (adım başına, 30-34)", odul: "Full Plate serisi", oneri: "hemen", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "war-materials-2", ad: "Second preparation of war materials", aralik: "20-35", level: 30, npc: { ikisi: "[Mercenary Supply Officer] Osmond" }, bolge: "Folk Village çevresi", hedef: "Field boss: Wolfraiger, Omegatron, Gavoltin, Scolaid", exp: 250_000, oneri: "hemen", parti: "onerilir", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "berret-31", ad: "Antidote / Wolf Products / Smirdons Meat / Smirdons Hides", aralik: "20-35", level: 31, npc: { ikisi: "[Entrepot Trader] Berret" }, bolge: "Folk Village (393,550)", hedef: "Apple of Moradon teslimatları", expMetni: "500 bin – 675 bin (her biri, 31-34)", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  // --- 35-45 kale ---
  { id: "new-adventure", ad: "The Beginning of a New Adventure 1", aralik: "35-45", level: 35, npc: { ikisi: "[Mercenary Captain] Cougar" }, bolge: "Moradon → kendi kalen (5.000 Noah)", odul: "100.000 Noah", oneri: "hemen", neden: "35'ten sonra ana bölge kendi kalen", kaynaklar: ["korehberiDb", "rehberBaslangic"] },
  { id: "royal-knight", ad: "Shadow Seeker Hunt / Sabertooth Hunt / Skeleton Warrior Hunt / Skeleton Knight Hunt / Death Knight Hunt", aralik: "35-45", level: 35, npc: { karus: "[Guard] Malverick", elmorad: "[Guard] Zalk" }, bolge: KB, exp: 4_895_000, expMetni: "270 bin – 1,875M (35-40)", odul: "Royal Knight seti + quest weapon", oneri: "hemen", neden: "Görev zırhı ve silahı: 35-45'in ekipmanı", celiski: "KO Rehber 2026: Shadow Seeker 1,1M, Death Knight 2,4M; 2022 veritabanı 270 bin ve 1,875M", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "clark-shymer-35", ad: "Animal Blood / Rotten Eye / Coarse Bone Powder / Offering / Orc Talisman / Covenant of Darkness", aralik: "35-45", level: 35, npc: { karus: "[Moradon Merchant] Shymer", elmorad: "[Moradon Merchant] Clark" }, bolge: KB, exp: 8_925_000, expMetni: "675 bin – 2,25M (35-42)", oneri: "hemen", neden: "Teslimat görevleri: premium açıkken yap (çoğu premiumda iki kat)", kaynaklar: ["korehberiDb"] },
  { id: "gravesite", ad: "Defend the Gravesite / Univited Guest at Gravesite", aralik: "35-45", level: 36, npc: { ikisi: "[Tomb Gatekeper] Slay / Bertem" }, bolge: KB, exp: 3_000_000, expMetni: "750 bin + 2,25M", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "draki-start", ad: "Investigation Mission", aralik: "35-45", level: 35, npc: { ikisi: "[Priest] Sol / Ann" }, bolge: "Draki's Tower", exp: 1_500_000, oneri: "ertele", neden: "Draki's Tower zinciri 35'ten listeleniyor ama rehberler 70+ rutinine koyuyor; 35'lik bir karakterle dene", yeniSunucu: "dogrula", kaynaklar: ["korehberiDb", "rehberDaily"] },
  { id: "ape-scouting", ad: "Ape Hunt / Scouting Report", aralik: "35-45", level: 44, npc: { ikisi: "[Mercenary] Tales / Russel · [Captain] Fargo / Falkwine" }, bolge: KB, exp: 5_000_000, expMetni: "2,5M + 2,5M", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  // --- 45-50 ---
  { id: "tales-45", ad: "Kongaus Hunt / Ash Knight Hunt / Haunga Hunt", aralik: "45-50", level: 45, npc: { ikisi: "[Mercenary] Tales / Russel" }, bolge: "Kale, Raon / Doda Camp", exp: 12_500_000, expMetni: "3,75M + 4,25M + 4,5M", oneri: "hemen", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "scuola-hornet", ad: "Scuola Hunt / Hornet Hunt", aralik: "45-50", level: 45, npc: { ikisi: "[Guard] Cheina / Keife · [Imperial Palace Guard] Telson / Verca" }, bolge: "Kale çevresi", exp: 7_750_000, expMetni: "3,75M + 4M", oneri: "hemen", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "party-board", ad: "[Party/Repeatable] bulletin-board quests", aralik: "45-50", level: 45, npc: { ikisi: "Linate / Raiba panoları" }, bolge: "Linate / Raiba", hedef: "20 Dragon Tooth Soldier, Troll, Harpy, Apostle …", expMetni: "0,75M – 2,5M (premiumda iki kat)", tekrar: "tekrar", parti: "zorunlu", oneri: "istege", neden: "Slot kasmasının üstüne eklenir; tek başına değil", kaynaklar: ["korehberiDb"] },
  { id: "legendary-ring", ad: "Legendary Ring", aralik: "45-50", level: 47, npc: { ikisi: "[Guard] Cheina / Keife" }, bolge: "Kale çevresi", hedef: "20 Macairodus", odul: "Quest ring (grade 1)", tekrar: "tekrar", oneri: "istege", kaynaklar: ["korehberiDb"] },
  // --- 50-60 ---
  { id: "crack-of-all-means", ad: "Crack of All Means", zincir: true, aralik: "50-60", level: 50, npc: { karus: "[Advisor] Herga", elmorad: "[Advisor] Nez" }, bolge: "Kale, Kalluga Valley, Asga / Bellua, Ronark Land", exp: 170_250_000, expMetni: "~170M, 27 adım (50-59)", oneri: "hemen", neden: "50'de ~11 bar; 65'te yapmaktan ~4 kat değerli. Şırınga adımlarında (Appropriate Prescription) mob EXP'si gelmez: premium boşa gitmesin", celiski: "Ronark Land adımı (Markus / Harrigan, Uncontrollable Mana) 70 giriş sınırına takılabilir", yeniSunucu: "dogrula", kaynaklar: ["korehberiDb", "steamChat", "kofarm183"] },
  { id: "chick-graduation", ad: "Chick Graduation", aralik: "50-60", level: 50, npc: { ikisi: "[Grand Merchant] Kaishan" }, bolge: "Moradon", odul: "Silah ya da zırh", oneri: "hemen", kaynaklar: ["rehberBaslangic"] },
  { id: "beth-hashan", ad: "Lamia Hunt / Eradicate Uruk Hai / Treant Hunt / Ancient Hunt / Manticore Hunt / Uruk Blade Hunt", aralik: "50-60", level: 50, npc: { ikisi: "[Guard] Beth / Hashan" }, bolge: "Linate / Laiba, Bellua / Asga", exp: 107_500_000, expMetni: "12,5M – 25M (50-56)", oneri: "hemen", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "legendary-acc", ad: "Legendary Earring / Legendary Belt / Legendary Pendant", aralik: "50-60", level: 50, npc: { ikisi: "[Mercenary] Tales · [Guard] Cheina" }, bolge: "Kale çevresi", hedef: "20 Sherrif / 20 Blood Don / 20 Garuna", odul: "Quest takıları", tekrar: "tekrar", oneri: "istege", kaynaklar: ["korehberiDb"] },
  { id: "dragon-tooth", ad: "Dragon Tooth Soldier Hunt / Dragon Tooth Knight Hunt", aralik: "50-60", level: 53, npc: { ikisi: "[Mercenary] Tales / Russel" }, bolge: "Linate / Laiba", exp: 30_000_000, expMetni: "13,75M + 16,25M", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "clark-shymer-55", ad: "Collection of Weapon materials / Collection of Magic materials / Ecosystem Research 1 / Ecosystem Research 2", aralik: "50-60", level: 55, npc: { karus: "[Moradon Merchant] Shymer", elmorad: "[Moradon Merchant] Clark" }, bolge: KB, exp: 100_000_000, expMetni: "4 × 25M", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "keife-56", ad: "Grell Hunt / Hell Hound Hunt / Manticore Hunt", aralik: "50-60", level: 56, npc: { ikisi: "[Guard] Cheina / Keife" }, bolge: "Linate / Laiba", exp: 92_500_000, expMetni: "30M + 30M + 32,5M", oneri: "hemen", neden: "58'deki \"Manticore Hunt\" aslında Dragon Tooth Commander avı (oyundaki ad hatalı)", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "telson-57", ad: "Phantom Hunt / Gloom Hound Hunt", aralik: "50-60", level: 57, npc: { ikisi: "[Imperial Palace Guard] Telson / Verca" }, bolge: "Delos", exp: 65_000_000, expMetni: "30M + 35M", oneri: "hemen", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "guard-tower", ad: "Protector of Guard Tower", aralik: "50-60", level: 56, npc: { ikisi: "Ronark Land Base" }, bolge: "Ronark Land Base", exp: 3_500_000, oneri: "atla", neden: "Ronark Land Base yeni sunucularda yok", yeniSunucu: "yok", kaynaklar: ["rehberCz", "rehberYeni"] },
  { id: "preemptive-strike", ad: "Preemptive Strike", aralik: "50-60", level: 59, npc: { ikisi: "[Mercenary] Tales / Russel" }, bolge: "Field boss bölgeleri", hedef: "Master malzemesi düşüren iki [Field Boss] türünden 10'ar", exp: 25_000_000, parti: "onerilir", oneri: "hemen", neden: "Master malzemesi farmıyla aynı bosslar: birlikte yap", kaynaklar: ["korehberiDb"] },
  // --- 60-70 Eslant ---
  { id: "master", ad: "Master", aralik: "60-70", level: 60, npc: { ikisi: "Sınıf ustası (Sınıfına göre panelinde)" }, bolge: "Kale", hedef: "1 Unstable Centaur' Heart + sınıfa göre 2 essence", oneri: "hemen", zorunlu: true, neden: "Malzemeler takas edilebilir; açılışta boss yarışı olur, 60'tan önce topla", kaynaklar: ["rehberMaster"] },
  { id: "guardian-7-keys", ad: "Guardian of 7 Keys", aralik: "60-70", level: 60, npc: { karus: "[Captain] Fargo", elmorad: "[Captain] Falkwine" }, bolge: "Kale + yedi bekçi", hedef: "Bekçileri sırayla gez (cevaplar 1-1-2-2-1-2-2), Seventh Key'i kaptana götür", exp: 38_047_370, oneri: "hemen", celiski: "KoFarmAnaliz 50. level diyor; KO Rehber ve GameSatış 60", kaynaklar: ["rehber7Keys", "gamesatisChat", "kofarm183"] },
  { id: "ascetic-60", ad: "Commending the fallen warriors / Noises that don't let us sleep", aralik: "60-70", level: 60, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "5 Medal for the Leader (Dragon Tooth Commander) · 5 Feather of Harpy", exp: 135_000_000, expMetni: "2 × 67,5M", oneri: "hemen", neden: "Her biri neredeyse bir bar (60'ta)", celiski: "2022 veritabanı: 22,5M–45M ve 10-20 eşya; 2026 rehberi 67,5M ve 5 eşya", kaynaklar: ["rehberSpots", "korehberiDb"] },
  { id: "ascetic-kill-60", ad: "Dominated warriors / Identify of the strange weeping / Acolytes' counter attack", aralik: "60-70", level: 60, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "20 Dragon Tooth Commander / Harpy / Apostle; (1) ve (2) sürümleri", expMetni: "~21,25M (her biri)", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "boss-horrible-spoil", ad: "[Descendant of Hero/Boss] Horrible Spoil", aralik: "60-70", level: 60, npc: { karus: "[Captain] Fargo", elmorad: "[Captain] Falkwine" }, bolge: "Eslant", hedef: "Right Arm of Grendel (Grendel, 73)", exp: 25_000_000, odul: "2 Certificate of Victory, 150 NP", parti: "zorunlu", oneri: "hemen", neden: "Certificate of Victory: 62'deki master skill 7 tane istiyor", kaynaklar: ["korehberiDb", "rehberSkill"] },
  { id: "ascetic-61", ad: "Evidence of Pagan / Armors without souls", aralik: "60-70", level: 61, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "10'ar eşya (Apostle, Doom Knight)", exp: 150_000_000, expMetni: "2 × 75M", oneri: "hemen", kaynaklar: ["rehberSpots"] },
  { id: "boss-revenge", ad: "[Long Revenge/Boss] Revenge vs. Revenge", aralik: "60-70", level: 61, npc: { karus: "[Captain] Fargo", elmorad: "[Captain] Falkwine" }, bolge: "Eslant", hedef: "Hair of Grendel's Mother (79. level boss)", exp: 37_500_000, odul: "2 Certificate of Victory", parti: "zorunlu", oneri: "ertele", neden: "Boss 79. level: sonra, güçlü partiyle", kaynaklar: ["korehberiDb", "rehberEslant"] },
  { id: "boss-fighting", ad: "[Self-made Hero/Boss] Fighting is the best way", aralik: "60-70", level: 62, npc: { karus: "[Captain] Fargo", elmorad: "[Captain] Falkwine" }, bolge: "Eslant", hedef: "2nd Molar of the Red Dragon (Fierce Red Dragon, 64)", exp: 50_000_000, odul: "2 Certificate of Victory", parti: "zorunlu", oneri: "hemen", kaynaklar: ["korehberiDb", "rehberEslant"] },
  { id: "ascetic-62", ad: "Giants Bone / Skin harder than stone", aralik: "60-70", level: 62, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "10 Bones of Troll · 10 Gargoyle Skin (Ironclaw)", exp: 165_000_000, expMetni: "2 × 82,5M (62-63)", oneri: "hemen", kaynaklar: ["rehberSpots"] },
  { id: "boss-63-65", ad: "[Failed Mission/Boss] Securing Retreat Route / [Hidden Truth/Boss] Barbarian King / [Regained Honor] Downfall of Betrayer", aralik: "60-70", level: 63, npc: { karus: "[Captain] Fargo", elmorad: "[Captain] Falkwine" }, bolge: "Eslant", exp: 157_500_000, expMetni: "50M + 50M + 57,5M", odul: "Adım başına 2 Certificate of Victory", parti: "zorunlu", oneri: "hemen", neden: "Boss beklemesi uzun olabilir: süreyi ölçerek yap", kaynaklar: ["korehberiDb", "kofarm183"] },
  { id: "ascetic-staff", ad: "The staff that calls upon the fire, the ice and the storm", aralik: "60-70", level: 64, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "10 Staff of Disciple (Apostle of Flame, 78. level mob)", exp: 90_000_000, oneri: "ertele", neden: "Hedef mob 78. level: 75-80'de Apostle of Flame avıyla birlikte yap", kaynaklar: ["rehberSpots"] },
  { id: "chat-goblin", ad: "[Goblin Subjugation]", zincir: true, aralik: "60-70", level: 60, npc: { karus: "Raul / Berg", elmorad: "Wells / Grey" }, bolge: "Eslant", exp: 117_750_000, expMetni: "~117,75M, 18 adım", oneri: "hemen", celiski: "Başlangıç leveli kaynaklarda net değil", kaynaklar: ["gamesatisChat", "korehberiDb"] },
  { id: "chat-sailor", ad: "Sailor chain", zincir: true, aralik: "60-70", level: 61, npc: { karus: "[Captain] Pasha", elmorad: "[Captain] Redin" }, bolge: "Eslant", exp: 86_125_000, expMetni: "~86,1M, 21 adım (61-67)", oneri: "hemen", kaynaklar: ["gamesatisChat", "korehberiDb"] },
  { id: "chat-sorcery", ad: "Sorcery chain", zincir: true, aralik: "60-70", level: 65, npc: { ikisi: "Malraseu / Pelor" }, bolge: "Eslant", exp: 171_250_000, expMetni: "~171,25M (65-69)", oneri: "hemen", kaynaklar: ["gamesatisChat", "korehberiDb"] },
  { id: "removing-magic", ad: "Removing Magic of Darkness I–V / Sinner of Nightmare", aralik: "60-70", level: 65, npc: { ikisi: "[Order of the Sorcery] Cesar / Reisa" }, bolge: "Eslant", expMetni: "25M (her biri)", oneri: "hemen", kaynaklar: ["rehberEslant"] },
  { id: "ascetic-66-68", ad: "Jeweled horse shoe! / Noises that don't let us sleep (2)", aralik: "60-70", level: 66, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "Satiros · 10 Wings of Harpy (Raven Harpy)", exp: 247_500_000, expMetni: "112,5M + 135M (66-68)", oneri: "hemen", kaynaklar: ["rehberSpots"] },
  { id: "eslant-daily", ad: "[Daily Party] Eslant quests", aralik: "60-70", level: 60, npc: { karus: "Hill", elmorad: "Lily" }, bolge: "Eslant", hedef: "50 Dark Stone, 50 Booro (5M'er) · 50 Titan, 50 Balrog (7M'er)", exp: 24_000_000, expMetni: "24M / gün (Dark Mithril Piece ile 34M)", tekrar: "gunluk", parti: "zorunlu", oneri: "hemen", neden: "Partisiz alınamaz; hedefler 83-88. level: 60'larda yüksek levelli üyelerle taşıma partisi", kaynaklar: ["rehberDaily"] },
  { id: "agata-repeatable", ad: "[Repeatable] hunts (Agata / Pablo)", aralik: "60-70", level: 60, npc: { ikisi: "[Eslant Sage] Pablo / Agata" }, bolge: "Eslant", expMetni: "1M – 2,5M", tekrar: "tekrar", oneri: "atla", neden: "Bara göre çok küçük", kaynaklar: ["kofarm183"] },
  { id: "rlb-chains", ad: "[Legless Devil] / [Great Battle] / [Prophetic Poetry of Light] / [New Hero]", aralik: "60-70", level: 66, npc: { ikisi: "Ronark Land Base NPC'leri" }, bolge: "Ronark Land Base", oneri: "atla", neden: "Ronark Land Base yeni sunucularda yok", yeniSunucu: "yok", kaynaklar: ["rehberCz", "rehberYeni"] },
  // --- 70-75 Ronark Land ---
  { id: "legens-resurrection", ad: "Legen's Resurrection", aralik: "70-75", level: 70, npc: { karus: "[Outpost Captain] Elrod", elmorad: "[Outpost Captain] Della" }, bolge: "Ronark Land", hedef: "120 Evil Wizard", exp: 115_000_000, parti: "onerilir", oneri: "hemen", neden: "Ronark Land'e grup halinde gir (70, 17.000 Noah; 0 NP ile girilmez)", kaynaklar: ["rehberCz", "korehberiDb"] },
  { id: "lemegeton", ad: "Lemegeton", zincir: true, aralik: "70-75", level: 70, npc: { karus: "[Order of the Sorcery] Bros", elmorad: "[Order of the Sorcery] Sais" }, bolge: "Ronark Land + Eslant (Demon Summon Stones)", exp: 918_000_000, expMetni: "~918M, 57 adım (70-75)", odul: "Sonda 2 Voucher of Chaos; Certificate of Victory", parti: "onerilir", oneri: "hemen", neden: "70→75 ihtiyacının ~%39'u", kaynaklar: ["rehberCz", "korehberiDb"] },
  { id: "uranos", ad: "Uranos chain", zincir: true, aralik: "70-75", level: 70, npc: { ikisi: "Eslant" }, bolge: "Eslant", exp: 18_750_000, oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "peace-ronark", ad: "Peace in Ronark Land", aralik: "70-75", level: 70, npc: { karus: "[Outpost Captain] Elrod", elmorad: "[Outpost Captain] Della" }, bolge: "Ronark Land", hedef: "100 PK", exp: 50_000_000, oneri: "istege", neden: "Yalnızca zaten PvP yapıyorsan", kaynaklar: ["rehberCz"] },
  { id: "draki-chain", ad: "Kidnapped Princess? / A Monster? or a Princess? / Spellbound Princess / Forgotten Princess / The Plan", zincir: true, aralik: "70-75", level: 70, npc: { ikisi: "[Priest] Sol / Ann" }, bolge: "Draki's Tower", expMetni: "20M – 65M (adım başına), zincir ~231,6M", oneri: "hemen", neden: "Günde 3 Draki girişiyle birlikte", yeniSunucu: "dogrula", kaynaklar: ["korehberiDb", "rehberDaily"] },
  { id: "patriarchs-followers", ad: "Patriarch's Followers", aralik: "70-75", level: 74, npc: { karus: "[Outpost Captain] Elrod", elmorad: "[Outpost Captain] Della" }, bolge: "Ronark Land", hedef: "Keramash, Medichmash, Nigmash", exp: 250_000_000, parti: "onerilir", oneri: "hemen", celiski: "Hedef sayısı: 60 + 60 + 80 (KO Rehberi) ile her birinden 40 (KO Rehber)", kaynaklar: ["korehberiDb", "rehberCz"] },
  // --- 75-80 Eslant ---
  { id: "dragon-hunt", ad: "Dragon hunt", aralik: "75-80", level: 75, npc: { ikisi: "[Mercenary Captain] Cougar" }, bolge: "Felankor", odul: "Exceptional weapon +5", parti: "zorunlu", oneri: "hemen", kaynaklar: ["korehberiDb"] },
  { id: "king-of-kings", ad: "King of Kings", aralik: "75-80", level: 75, npc: { ikisi: "Under the Castle etkinliği" }, bolge: "Cuma 21:00", exp: 25_000_000, parti: "zorunlu", oneri: "istege", neden: "Ölünce eşya yanabilir (Life Crystal)", kaynaklar: ["rehber183", "korehberiEtkinlik"] },
  { id: "apostle-flames", ad: "Aposlte of Flames hunt (1) / Aposlte of Flames hunt (2)", aralik: "75-80", level: 77, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "40 Apostle of Flame (park edilen staff görevini de bitir)", exp: 100_000_000, expMetni: "2 × 50M", parti: "onerilir", oneri: "hemen", kaynaklar: ["korehberiDb", "rehber183"] },
  { id: "unfinished-hunt", ad: "Unfinished hunt II (1) / Unfinished hunt II (2) / Unfinished hunt III", aralik: "75-80", level: 78, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "40 Troll Berserker · 40 Troll Captain", exp: 206_250_000, expMetni: "3 × 68,75M (78-79)", parti: "onerilir", oneri: "hemen", kaynaklar: ["korehberiDb", "rehber183"] },
  // --- 80-83: sınır 80 iken sakla ---
  { id: "nightmare", ad: "Nightmare (1) / Nightmare (2)", aralik: "80-83", level: 80, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "80 Booro", exp: 167_500_000, expMetni: "2 × 83,75M", parti: "onerilir", oneri: "sakla", kaynaklar: ["kofarm183", "rehber183"] },
  { id: "past-mistake", ad: "Past Mistake (1) / Past Mistake (2)", aralik: "80-83", level: 81, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "80 Dark Stone", exp: 167_500_000, expMetni: "2 × 83,75M", parti: "onerilir", oneri: "sakla", kaynaklar: ["kofarm183", "rehber183"] },
  { id: "fallen-spirit", ad: "Fallen Spirit of Flame (1) / Fallen Spirit of Flame (2)", aralik: "80-83", level: 82, npc: { karus: "[Ascetic] Veda", elmorad: "[Ascetic] Tabeth" }, bolge: "Eslant", hedef: "80 Balrog", exp: 205_000_000, expMetni: "2 × 102,5M", parti: "onerilir", oneri: "sakla", kaynaklar: ["kofarm183", "rehber183"] },
];

export interface Aralik {
  id: AralikId;
  ad: string;
  levelMin: number;
  /** Aralığın bittiği level (bir sonrakinin başı) */
  levelMax: number;
  bolge: string;
  taktik: string;
  /** Görevler bitince: mob (level) */
  kasma: string[];
}

export const ARALIKLAR: Aralik[] = [
  { id: "1-10", ad: "1–10", levelMin: 1, levelMax: 10, bolge: "Moradon A", taktik: "Aynı bölgedeki avları birlikte al, her biri için şehre dönme. 10'da Kaishan'dan 1st job change.", kasma: ["Worm, Bandicoot, Kecoon (1–8)"] },
  { id: "10-20", ad: "10–20", levelMin: 10, levelMax: 20, bolge: "Moradon B (güney)", taktik: "Patrick'in avları sırayla açılır; Hepa'nın görev silahını al, Cougar'ın Discipline zindanını yap.", kasma: ["Bulcan, Gavolt (13–22)"] },
  { id: "20-35", ad: "20–35", levelMin: 20, levelMax: 35, bolge: "Folk Village (3.000 Noah)", taktik: "Lazi'nin Battle Armor ve Full Plate serileri zırh ihtiyacını karşılar; pazardan alma. 30'da dört field boss görevi.", kasma: ["Giant Bulcan, Werewolf, Silan (19–27)", "Erken partide Tale Village Death Knight"] },
  { id: "35-45", ad: "35–45", levelMin: 35, levelMax: 45, bolge: "Kendi kalen (5.000 Noah)", taktik: "Malverick / Zalk avları Royal Knight setini ve quest silahını verir. Teslimat görevlerini premium açıkken yap.", kasma: ["Skeleton Knight (36), Sabertooth (43), Death Knight (45)", "[Repeatable Solo] Lard Orc, Megantereon, Ape (1M; premium 1,4M)"] },
  { id: "45-50", ad: "45–50", levelMin: 45, levelMax: 50, bolge: "Kale, Raon / Doda Camp, Linate / Raiba", taktik: "Tales / Russel, Cheina / Keife, Telson / Verca avları. Linate / Raiba panolarındaki parti görevleri slot kasmasının üstüne eklenir. Ardream yok: herkes anavatanda.", kasma: ["Partiyle Harpy (mage partisi), Apostle ve Deruvish (melee)", "Delos: Phantom (48)"] },
  { id: "50-60", ad: "50–60", levelMin: 50, levelMax: 60, bolge: "Linate / Laiba, Bellua / Asga, Delos", taktik: "50'de Crack of All Means'i hemen başlat. 55'ten sonra tekrarlanabilir avlar bara göre küçük: partiye geç. Master malzemesini 60'tan önce topla.", kasma: ["Dragon Tooth Soldier / Commander, Troll", "Delos: Gloom Hound (58)"] },
  { id: "60-70", ad: "60–70", levelMin: 60, levelMax: 70, bolge: "Eslant (17.000 Noah)", taktik: "60'ta Master, Guardian of 7 Keys ve Ascetic teslimatları: her biri neredeyse bir bar. Boss zincirlerinden 7 Certificate of Victory topla (62'deki master skill). Kalıcı partiyi şimdi kur: Eslant daily'leri solo alınmaz.", kasma: ["Brahman (73), Paramun (76)", "Giant Golem (64), Stone Golem (69), Titan (83)"] },
  { id: "70-75", ad: "70–75", levelMin: 70, levelMax: 75, bolge: "Ronark Land (17.000 Noah) + Eslant", taktik: "Ronark Land'e grup halinde gir: yeni sunucuda daha düşük bir PvP haritası yok. Görevler ihtiyacın ~%46'sı; kalanı Eslant partisi ve BDW.", kasma: ["Evil Wizard (79), Keramash / Medichmash / Nigmash (84–86)", "Eslant: Brahman, Troll, Paramun, Doom Soldier (76)"] },
  { id: "75-80", ad: "75–80", levelMin: 75, levelMax: 80, bolge: "Eslant", taktik: "Görevler ihtiyacın yalnızca ~%10'u. Asıl EXP: EXP Premium'lu, dağılmayan Eslant partisi, buff'lar ve günde 3 BDW.", kasma: ["Paramun, Titan, Falcon (80)", "Booro (86), Dark Stone (85), Balrog (88)"] },
  { id: "80-83", ad: "80–83", levelMin: 80, levelMax: 83, bolge: "Eslant", taktik: "Sınır 80 iken teslim etme: 80'de teslim edilen EXP'nin saklandığını gösteren kaynak yok. 83 açılınca bu altı görev 80 barının ~%25'i.", kasma: ["Booro, Dark Stone, Balrog (Eslant daily'leriyle aynı moblar)"] },
];

/** Görevlerin aralık başına toplam EXP'si (rapordaki hesap, mob EXP'si hariç) */
export const GOREV_KARSILAMA: { ad: string; a: number; b: number; gorevExp: number }[] = [
  { ad: "1–10", a: 1, b: 10, gorevExp: 60_000 },
  { ad: "10–20", a: 10, b: 20, gorevExp: 220_000 },
  { ad: "20–35", a: 20, b: 35, gorevExp: 7_000_000 },
  { ad: "35–45", a: 35, b: 45, gorevExp: 27_000_000 },
  { ad: "45–60", a: 45, b: 60, gorevExp: 660_000_000 },
  { ad: "60–70", a: 60, b: 70, gorevExp: 2_400_000_000 },
  { ad: "70–75", a: 70, b: 75, gorevExp: 1_090_000_000 },
  { ad: "75–80", a: 75, b: 80, gorevExp: 610_000_000 },
];

export interface Etkinlik {
  ad: string;
  seviye: string;
  saat: string;
  deger: string;
  /** 2022 yeni sunucularının açılışında */
  acilista: string;
}

export const ETKINLIKLER: Etkinlik[] = [
  { ad: "Border Defense War", seviye: "Level bandına göre eşleşme", saat: "02:00, 13:00, 19:00", deger: "Kazanan da kaybeden de EXP alır, ayrıca 2 saat %20 EXP eşyası. Günde 3 kez; en değerli etkinlik", acilista: "Açıktı" },
  { ad: "Chaos Dungeon", seviye: "70 (2022) / sınırsız (2026), çelişkili", saat: "00:00, 12:00", deger: "En fazla ~8M EXP (60'ta barın ~%11'i, 70'te ~%2,6'sı)", acilista: "Açıktı" },
  { ad: "Forgotten Temple", seviye: "46+ (46–59 ve 60–83 bantları)", saat: "03:00, 22:00", deger: "Hasara göre sandık", acilista: "Açıktı" },
  { ad: "Juraid Mountain", seviye: "70+ (bir rehber ~75)", saat: "07:40, 22:40", deger: "Gem; kazanan taraf 50M (premium) / 20M EXP", acilista: "~4 hafta sonra" },
  { ad: "Under the Castle", seviye: "75+", saat: "Cuma 21:00", deger: "King of Kings 25M; ölünce eşya yanabilir", acilista: "Bilinmiyor" },
  { ad: "Draki's Tower", seviye: "Bölümler 10–29 … 83+", saat: "Günde 3 giriş, 18:00'de sıfırlanır", deger: "Chat görevleri yüksek EXP; 20 dakikanın altında bitirmek kalıcı +%5", acilista: "Bilinmiyor" },
  { ad: "Monster Stone", seviye: "20–83 bantları", saat: "Eşyayla açılır", deger: "Solo instance", acilista: "Bilinmiyor" },
  { ad: "Bifrost, Krowaz's Dominion, Lunar War, Castle Siege War", seviye: "—", saat: "Değişik", deger: "EXP değil: malzeme ve NP", acilista: "Lunar War açıktı" },
];

export const GUNLUK_DUZEN: string[] = [
  "Moradon'da Akara's Altar: \"I Love Knight Online\" +%20, \"I will continue playing Knight Online\" +%10 (toplam 8 saat)",
  "Günlük ücretsiz çark (Ascent Scroll çıkabilir)",
  "12:00 Chaos Dungeon (60 altına daha değerli), 13:00 Border Defense War",
  "Akşam: 19:00 BDW → 21:00 Bifrost → 22:00 Forgotten Temple → 22:40 Juraid Mountain",
  "BDW'den sonra doğrudan slota git: 2 saatlik %20 eşyası boşa gitmesin",
  "Bir sonraki etkinliğe 30 dakikadan az varsa yeni kasma döngüsüne başlama",
];

export interface Bonus {
  ad: string;
  deger: string;
  not?: string;
}

export const PREMIUMLAR: Bonus[] = [
  { ad: "EXP Premium", deger: "%400 (1–50), %300 (51–60), %200 (61–70), %120 (71–83)", not: "Kopazar / Foxngame: %300 (1–80), %120 (80–83). Ölümde %1 kayıp, 4 EXP Flash hakkı. 51'den sonra Platinum'dan iyi" },
  { ad: "Platinum Premium", deger: "%400 (1–50), %100 (51–83)", not: "Satın alınca hemen aktif" },
  { ad: "WAR Premium", deger: "%100", not: "Ölümde %2,5 kayıp; günde ikinci Chaos girişi" },
  { ad: "DISC / Gold / Bronze", deger: "%30 / %30 / %20" },
];

export const BUFFLAR: Bonus[] = [
  { ad: "Symbol of Growth", deger: "+%400, 1 saat", not: "Yalnızca 1–50" },
  { ad: "Symbol of Gladiator / Symbol of Warrior", deger: "+%70 / +%40, 1 saat", not: "1–50 / 1–60" },
  { ad: "Spirit of Logos", deger: "+%100, 1 saat", not: "Dünya NPC'si, ~8–10 saatte bir; pencere açık tutulursa parti ve klan da alır" },
  { ad: "Tail of Shaula / Tail of Lesath", deger: "+%100, 1 saat", not: "Ölünce, kopunca ya da harita değişince silinir: slotta aç" },
  { ad: "EXP Flash", deger: "+%10 (her biri)", not: "EXP Premium ile 4 tane" },
  { ad: "BDW ödülü", deger: "+%20, 2 saat" },
  { ad: "Akara's Altar amblemleri", deger: "+%20 ve +%10, 8 saat" },
  { ad: "Dragon's Wing / Valkyrie", deger: "+%9 / +%4 ve +%2" },
  { ad: "Başarımlar", deger: "Kalıcı +%3 (Four Phases of Life) ve +%5 (Berserker of Draki's Tower)" },
  { ad: "60% Re-Spawn Scroll", deger: "Ölümde kaybedilen EXP'nin %60'ı geri", not: "79'da %1 kayıp ~17,6M, %2,5 kayıp ~44M EXP" },
];

export const BONUS_NOTU = "Bonuslar çarpılmaz, toplanır (UcuzaGB modeli, resmi değil). 71–79'da ulaşılabilecek en yüksek yığın ~+%330: yalnızca premiumla kasmanın iki katından biraz fazla. 8 kişilik partide üye başına pay ~%30, parti toplamı soloya göre ~2,4×; parti ±8 level, aynı klan bu sınıra takılmaz.";

export interface SinifNotu {
  sinif: "warrior" | "rogue" | "mage" | "priest" | "kurian";
  solo: string;
  parti: string;
  master: string;
  /** 70/75/80 skill görevleri için toplam Spell Stone Powder */
  powder: number;
  dikkat: string;
}

export const SINIF_NOTLARI: SinifNotu[] = [
  { sinif: "warrior", solo: "Güçlü: Provoke ile toplama, Blade Of Hell, kendini iyileştiren skiller", parti: "Melee partide puller, Battle Cry", master: "[Warrior Master] Skaki: Urkthron's Essence + Alkeradeua's Essence", powder: 30, dikkat: "Önce Attack 60 (Sword Dancing)" },
  { sinif: "kurian", solo: "Güçlü: Flyer, Blow, Critical Thunder (alan), kendi heal'leri", parti: "Melee puller ya da tank", master: "[Grand Elder] Morbor / Atlas: Urkthron's + Alkeradeua's Essence", powder: 25, dikkat: "Önce Attack 15 + Devil 10; 70'te skill görevi yok, yalnızca 75 ve 80" },
  { sinif: "mage", solo: "Orta: alan hasarı var ama MP tüketimi yüksek, kırılgan", parti: "AoE mage partisi (Inferno 45, Supernova 60, Meteor Fall 70) ya da TP mage", master: "[Archmage] Drake: Colmicola's + GaruKonga's Essence", powder: 37, dikkat: "INT asa şartına kadar, kalanı MP; glacier partide işe yaramaz" },
  { sinif: "rogue", solo: "İyi: menzilli, ama ok tükenir ve slotlarda botlarla yarışır", parti: "En kolay parti bulan sınıf: okçu slotları ya da iki hançerle assassin", master: "[Secret Agent] Clarence: GaruKonga's + Trethonz's Essence", powder: 37, dikkat: "DEX 255 + HP; okçu → assassin geçişi 59'dan önce ucuz (Mid-Grade reset)" },
  { sinif: "priest", solo: "Zayıf (Battle Priest hariç)", parti: "Her EXP partisine bir buff / heal priest", master: "[Priest] Minerva: Colmicola's + Trethonz's Essence", powder: 69, dikkat: "En çok powder isteyen sınıf: önce priest'lere stokla (Bless Of God, Critical Restore)" },
];

export const SINIF_ORTAK_NOTU = "Master: 1 Unstable Centaur' Heart (Centaur Foal) + iki essence (Kamicollo, Garukonga, Urukthrone, Alkedrada field bossları); hepsi takas edilebilir. 62'deki master skill 7 Certificate of Victory ister (boss zincirleri, Lemegeton). 70–80 skill görevleri yalnızca Spell Stone Powder ister (Moradon'da [Mysterious] Narki'ye takı söktürerek).";
