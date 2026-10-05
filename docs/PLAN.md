# Klan Paneli: Plan

Knight Online yeni sunucuları (12 Kasım 2026, 16:00 TSİ) için klan içi, Discord girişli web paneli.

- Tasarım prototipi: [`design/prototype.html`](../design/prototype.html) (tarayıcıda açılır, örnek verilerle çalışır)
- Bu doküman paralel çalışan cloud oturumlarının ortak referansıdır. Kapsam, dosya sahipliği ve kabul kriterleri burada.

---

## 1. Kapsam (v1)

| Özellik | Ne yapar | Kim kullanır |
|---|---|---|
| **Açılış geri sayımı** | Sunucu açılışına geri sayım, açılış aşamaları (ön kayıt, sunucu seçimi, karakter oluşturma), klanın hazırlık durumu | Herkes görür, tarihleri yöneticiler düzeltir |
| **Üye listesi ve roller** | Karakter, sınıf, level, rütbe, durum, Discord adı; filtre ve arama; sınıf dağılımı | Herkes görür, yetkililer düzenler |
| **Etkinlik katılım takibi** | Etkinlik oluşturma, etkinlik sırasında yoklama (Katıldı / Geç / Mazeretli / Yok), türlere ve üyelere göre katılım oranı | Yetkililer işaretler, üyeler kendi geçmişini görür |
| **Takvim ve duyurular** | Aylık takvim (telefonda ajanda), haftalık etkinlik düzeni, duyurular, sabitleme, Discord kanalına gönderim | Herkes görür, yetkililer yazar |

**v1 dışında (sonra):** loot/DKP, Discord botu, üyelerin etkinliğe "katılacağım" bildirimi, oyun içinden otomatik veri çekme (KO'nun resmi API'si yok, tüm veri elle girilir).

### Panelin iki dönemi

Panel açılış tarihine göre görünüm değiştirir (prototipteki "Önizleme" anahtarı bunu gösteriyor):

- **Açılış öncesi:** Ana sayfada büyük geri sayım, açılış aşamaları ve hazırlık listesi (OTP, ön kayıt, sunucu seçimi, karakter adı). Üye tablosunda hazırlık sütunu. Yoklama yalnızca klan toplantıları için.
- **Açılış sonrası:** Ana sayfada sıradaki etkinliğe geri sayım, katılım özetleri. Üye tablosunda level. Hazırlık sütunu gizlenir.

---

## 2. Açılış takvimi (resmi bilgiler)

Kaynak: [NTTGame yeni sunucu sayfası](https://www.nttgame.com/knight/tr/newserveropen2026/) ve haber siteleri (5 Ekim 2026 itibarıyla).

| # | Aşama | Tarih | Not |
|---|---|---|---|
| 1 | 1. Ön kayıt | 15 – 29 Ekim | Ödüllü dönem. Telefon doğrulaması gerekli |
| 2 | 2. Ön kayıt ve sunucu seçimi | 29 Ekim – 9 Kasım | **Bazı kaynaklar bitişi 12 Kasım veriyor** |
| 3 | Karakter oluşturma | 10 – 11 Kasım | Bazı kaynaklar 10 – 12 Kasım diyor |
| 4 | Sunucu açılışı | **12 Kasım 2026 Perşembe, 16:00 TSİ** | `2026-11-12T13:00:00Z` |

Diğer bilgiler: Yeni sunuculara girişte **OTP zorunlu**. Yeni sunucularda **Ardream ve Ronark Land Base yok**, savaş yalnızca Ronark Land'de. Sunucu isimleri ve level sınırı henüz açıklanmadı.

Tarihler tutarsız olduğu için kodda sabit yazılmaz: `milestones` tablosunda tutulur, yöneticiler Ayarlar sayfasından düzeltir. Aşama saatleri duyurulmadığı için `saat_belli=false` olan aşamalarda yalnızca gün gösterilir.

---

## 3. Kullanıcılar ve yetkiler

Giriş **Discord** ile yapılır. İki ayrı kavram var:

- **Rütbe** (oyundaki unvan, görüntü amaçlı): Lider, Asistan, Subay, Üye, Aday. Karaktere bağlıdır.
- **Yetki** (panelde ne yapabildiği): hesaba bağlıdır.

| Yetki | Kim | Yapabilir |
|---|---|---|
| `yonetici` | Lider, asistanlar | Her şey + yetki verme, üyelik onayı, açılış tarihleri, klan ayarları |
| `yetkili` | Subaylar | Üye/karakter düzenleme, etkinlik oluşturma, yoklama, duyuru |
| `uye` | Onaylı üyeler | Her şeyi görme, kendi hazırlık listesini işaretleme |
| `beklemede` | İlk kez giriş yapan herkes | Sadece "onay bekleniyor" sayfası |

İsteğe bağlı: Discord `guilds` izniyle klan Discord sunucusunda olanlar otomatik `uye` olur (klan Discord sunucu ID'si gerekli).

---

## 4. Teknoloji

| Katman | Seçim | Neden |
|---|---|---|
| Uygulama | **Next.js 16** (App Router, Server Actions) + TypeScript + React 19 | Tek repo, Vercel'de sıfır ayar |
| Stil | **Tailwind CSS 4**, tasarım token'ları `globals.css` içinde CSS değişkeni | Prototipteki token'lar birebir taşınır |
| Yazı tipleri | `next/font/google`: Grenze (başlık, geri sayım), Barlow (gövde), Barlow Condensed (veri, etiket) | Türkçe karakter desteği var |
| Veri + giriş | **Supabase** (Postgres + Auth Discord sağlayıcısı + Row Level Security) | Ücretsiz katman yeterli, yetki kuralları veritabanında |
| Yayın | **Vercel** (ücretsiz) | Her PR için önizleme adresi |
| Discord bildirimi | Kanal **webhook**'u (sunucu tarafı, `DISCORD_WEBHOOK_URL` ortam değişkeni) | Bot kurmadan duyuru gönderimi |
| Test | Vitest (birim), Playwright (demo modunda duman testi) | |

### Demo modu (paralel çalışma için kritik)

Cloud oturumlarında Supabase bağlantısı olmayacak. Bu yüzden veri katmanı iki adaptörlü:

- `DATA_SOURCE=demo` → `lib/demo/fixtures.ts` içindeki örnek veriler (prototipteki 18 üye, etkinlikler, duyurular), bellek içinde.
- `DATA_SOURCE=supabase` → gerçek veritabanı.

Her özellik önce demo modunda çalışır ve test edilir. Supabase adaptörü aynı arayüzü uygular.

---

## 5. Veri modeli

Tek migration (`supabase/migrations/0001_init.sql`) Faz 0'da yazılır; Faz 1 oturumları şemayı değiştirmez.

```
profiles            id (auth.users), discord_id, discord_ad, avatar_url, yetki, created_at
characters          id, profile_id?, ad (unique), sinif, level?, rutbe, durum, ana_karakter, notlar, katilma_tarihi
hazirlik            profile_id (pk), otp, on_kayit, sunucu_secimi, karakter_adi, updated_at
milestones          id, sira, baslik, baslangic, bitis?, saat_belli, aciklama, kaynak_url
event_types         kod (pk), ad, kisa_ad, yoklama_var        -- csw, bdw, juraid, chaos, ft, boss, toplanti
events              id, tur → event_types, baslik, baslangic, bitis?, aciklama, schedule_id?, olusturan, created_at
recurring_schedules id, tur, baslik, gun (0-6), saat, sure_dk, aktif     -- haftalık düzen
attendance          event_id + character_id (pk), durum, isaretleyen, updated_at
announcements       id, baslik, govde, sabit, discord_gonderildi_at?, yazar, created_at
clan_settings       tek satır: klan_adi, irk (karus | el_morad), sunucu_adi?, discord_guild_id?
```

Enum'lar:
- `sinif`: warrior, rogue, mage, priest, kurian (El Morad'da Porutu; görüntülemede ırka göre ad değişir)
- `rutbe`: lider, asistan, subay, uye, aday
- `durum` (karakter): aktif, izinli, pasif, ayrildi
- `yoklama`: katildi, gec, mazeretli, yok
- `yetki`: yonetici, yetkili, uye, beklemede

RLS kuralları (özet):
- Okuma: `uye` ve üstü her tabloyu okur. `beklemede` yalnızca kendi profilini okur.
- Yazma: `characters`, `events`, `attendance`, `announcements`, `recurring_schedules` → `yetkili` ve üstü.
- `hazirlik` → herkes yalnızca kendi satırını yazar.
- `profiles.yetki`, `milestones`, `clan_settings` → yalnızca `yonetici`.

Katılım oranı = (katildi + gec) / işaretlenmiş yoklama sayısı. Mazeretli oranı düşürür ama ayrı gösterilir.

---

## 6. Sayfalar

| Yol | Sayfa | Prototipteki karşılığı |
|---|---|---|
| `/giris` | Discord ile giriş | yok |
| `/auth/callback` | OAuth dönüşü | yok |
| `/beklemede` | Onay bekleniyor | yok |
| `/` | Genel bakış (geri sayım, aşamalar, hazırlık, yaklaşanlar, sabit duyuru) | Genel bakış |
| `/uyeler` | Üye tablosu, sınıf dağılımı, rütbe özeti | Üyeler |
| `/uyeler/[id]` | Karakter detayı, katılım geçmişi | yok |
| `/etkinlikler` | Etkinlik listesi, tür bazında katılım, en istikrarlı üyeler | Etkinlikler ve katılım |
| `/etkinlikler/[id]` | Yoklama ekranı | Etkinlikler (sağ panel) |
| `/takvim` | Aylık takvim, haftalık düzen | Takvim ve duyurular |
| `/duyurular` | Duyuru listesi ve yazma formu | Takvim ve duyurular |
| `/ayarlar` | Açılış tarihleri, klan bilgisi, yetkiler, üyelik onayı | yok |

Tasarım kuralları prototipten gelir: koyu tema öncelikli (açık tema da var), tek altın vurgu rengi, sınıf renkleri sabit sırada (Warrior mavi, Rogue turuncu, Mage su yeşili, Priest sarı, Kurian pembe) ve her zaman yazıyla birlikte, durumlar renk + etiketle.

---

## 7. Yol haritası ve paralel cloud oturumları

```
Faz 0  Temel altyapı          ──── 1 oturum (sıralı, diğerleri buna bağlı)
          │
Faz 1  ┌─ A: Üyeler            ┐
       ├─ B: Etkinlik + yoklama │  4 paralel oturum, her biri kendi dalında
       ├─ C: Takvim + duyurular │
       └─ D: Genel bakış + ayarlar┘
          │
Faz 2  Entegrasyon ve yayın   ──── 1 oturum
```

### Faz 0: Temel altyapı (1 oturum)

Teslim edilecekler:
1. Next.js 16 + TS + Tailwind 4 + ESLint iskeleti, `npm run lint | typecheck | test | build` komutları.
2. `app/globals.css`: prototipteki tüm renk ve yazı token'ları (koyu öncelikli, açık tema `prefers-color-scheme` ile).
3. Ortak arayüz parçaları `components/ui/`: Panel, Button, Tag, Pill (durum), ClassChip, Segmented, DateBlock, Meter, Tooltip, Toast.
4. Uygulama kabuğu `app/(panel)/layout.tsx`: arma + klan adı, sekmeler, kullanıcı rozeti; her sayfa için boş yer tutucu.
5. `supabase/migrations/0001_init.sql` (tüm şema + RLS + seed: event_types, milestones) ve `lib/database.types.ts`.
6. Veri katmanı arayüzleri `lib/data/*.ts` (fonksiyon imzaları + demo adaptörü) ve `lib/demo/fixtures.ts`.
7. `lib/auth.ts`: `getCurrentUser()`, `requireYetki(min)`; demo modunda prototipteki "Yetkili / Üye" anahtarı gibi çerezle değişen sahte kullanıcı.
8. `lib/time.ts`: TSİ biçimlendirme, "3 gün sonra" gibi göreli tarih, açılış öncesi/sonrası tespiti (birim testli).
9. GitHub Actions: lint, typecheck, test, build.
10. `README.md`: yerel çalıştırma (demo modu), ortam değişkenleri.

### Faz 1: Paralel oturumlar

Her oturum Faz 0'ın birleştiği `main` dalından başlar, kendi dalında çalışır ve PR açar. **Yalnızca kendi klasörlerine yazar.** Ortak dosyada değişiklik gerekiyorsa (ör. `components/ui`) PR açıklamasında belirtir, kendisi değiştirmez; ihtiyaç Faz 2'de toplanır.

| Oturum | Dal | Sahip olduğu dosyalar | Kabul kriterleri |
|---|---|---|---|
| **A: Üyeler** | `feat/uyeler` | `app/(panel)/uyeler/**`, `components/uyeler/**`, `lib/data/members.ts` (supabase adaptörü) | Filtre + arama, sınıf dağılımı, rütbe özeti, hazırlık sütunu (açılış öncesi) / level sütunu (sonrası), karakter ekle-düzenle formu (Server Action + doğrulama), karakter detayında katılım geçmişi |
| **B: Etkinlik + yoklama** | `feat/etkinlikler` | `app/(panel)/etkinlikler/**`, `components/etkinlikler/**`, `lib/data/events.ts`, `lib/data/attendance.ts` | Yaklaşan/geçmiş listesi, etkinlik oluştur-düzenle, yoklama ekranı (tek tıkla işaretleme, iyimser güncelleme, toplu işlemler), tür bazında katılım grafiği, en istikrarlı 5 üye, üyeler için salt okunur görünüm |
| **C: Takvim + duyurular** | `feat/takvim-duyurular` | `app/(panel)/takvim/**`, `app/(panel)/duyurular/**`, `components/takvim/**`, `components/duyurular/**`, `lib/data/announcements.ts`, `lib/data/schedule.ts`, `lib/discord/**` | Aylık takvim + telefonda ajanda, haftalık düzen düzenleme ve "bu haftanın etkinliklerini oluştur", duyuru yaz/sabitle/sil, Discord webhook gönderimi (hata durumunda yeniden dene + kullanıcıya açık mesaj), webhook birim testi (fetch mock) |
| **D: Genel bakış + ayarlar** | `feat/genel-ayarlar` | `app/(panel)/page.tsx`, `app/(panel)/ayarlar/**`, `app/beklemede/**`, `components/genel/**`, `lib/data/milestones.ts`, `lib/data/prep.ts`, `lib/data/settings.ts` | Geri sayım (istemci bileşeni, saniyelik), aşama zaman çizelgesi, klan hazırlığı + "benim hazırlığım", açılış sonrası özet kutuları, Ayarlar: açılış tarihleri, klan adı/ırk, yetki verme, bekleyen üyeleri onaylama |

Ortak kurallar:
- Her oturum bitmeden önce `lint`, `typecheck`, `test`, `build` temiz geçmeli.
- Demo modunda ekranlar prototiple aynı düzende olmalı; PR'a ekran görüntüsü (masaüstü + 400px telefon) eklenmeli.
- Metinler Türkçe, saatler TSİ.
- Başka oturumun klasörüne dokunulmaz.

### Faz 2: Entegrasyon ve yayın (1 oturum)

1. PR'ları sırayla birleştir (A → B → C → D), çakışmaları çöz, ortak bileşen isteklerini topla.
2. Playwright duman testi (demo modunda tüm sayfalar, iki tema, telefon genişliği).
3. Kurulum rehberi: Supabase projesi, Discord OAuth uygulaması, Vercel ortam değişkenleri, webhook.
4. İlk yöneticiyi atama betiği (`scripts/ilk-yonetici.sql`).

### Kullanıcının (klan liderinin) yapması gerekenler

Kod tarafı oturumlarla ilerler; aşağıdakiler hesap sahibinin işi:
- Supabase projesi açıp URL ve anahtarları Vercel'e girmek
- Discord Developer Portal'da OAuth uygulaması açıp Supabase'e bağlamak
- Klan Discord kanalında webhook oluşturmak
- Vercel'de repoyu bağlamak

---

## 8. Açık sorular

1. Klan adı ve arması? (Prototipte örnek: "Demir Sancak")
2. Irk: Karus mu El Morad mı? (Sınıf adları ve renk vurgusu buna göre)
3. Rütbe adları prototipteki gibi mi kalsın (Lider, Asistan, Subay, Üye, Aday)?
4. Discord sunucusunda olanlar otomatik onaylansın mı, yoksa her üyeyi yönetici mi onaylasın?
5. Haftalık etkinlik saatleri sunucu açılınca belli olacak; prototipteki saatler örnek.
