# L4BEL Klan Paneli: Plan

**L4BEL** klanı için Knight Online yeni sunucularına (12 Kasım 2026, 16:00 TSİ) yönelik, klan içi ve Discord girişli web paneli.

- Tasarım prototipi: [`design/prototype.html`](../design/prototype.html) (tarayıcıda açılır, örnek verilerle çalışır)
- Claude Design tuvali (ekranlar, kayıt, profil, renk paleti): https://claude.ai/artifact/DgqTbC48vWNhVAwpyawKkZ
- Renk paleti ve yazı tipleri: [`design/palet.md`](../design/palet.md), CSS değişkenleri: [`design/tokens.css`](../design/tokens.css)
- Bu doküman paralel çalışan cloud oturumlarının ortak referansıdır. Kapsam, dosya sahipliği ve kabul kriterleri burada.

---

## 1. Kapsam (v1)

| Özellik | Ne yapar | Kim kullanır |
|---|---|---|
| **Açılış geri sayımı** | Sunucu açılışına geri sayım, açılış aşamaları (ön kayıt, sunucu seçimi, karakter oluşturma), klanın hazırlık durumu | Herkes görür, tarihleri yöneticiler düzeltir |
| **Üye listesi ve roller** | Karakter, sınıf, level, rütbe, durum, Discord adı; filtre ve arama; sınıf dağılımı | Herkes görür, yetkililer düzenler |
| **Etkinlik katılım takibi** | Etkinlik oluşturma, etkinlik sırasında yoklama (Katıldı / Geç / Mazeretli / Yok), türlere ve üyelere göre katılım oranı | Yetkililer işaretler, üyeler kendi geçmişini görür |
| **Takvim ve duyurular** | Aylık takvim (telefonda ajanda), haftalık etkinlik düzeni, duyurular, sabitleme, Discord kanalına gönderim | Herkes görür, yetkililer yazar |
| **Davet koduyla kayıt** | Yeni üye, yetkililerin verdiği özel kodla kayıt olur: kod → Discord ile giriş → karakter bilgisi | Kodu yetkililer üretir, üyeler kullanır |
| **Profilim** | Üye kendi sınıfını ve levelini günceller; değişiklik üye listesine hemen yansır | Her üye kendi profilini |

**v1 dışında (sonra):** loot/DKP, Discord botu (oyuncu durumu: çevrimiçi / savaşta / AFK bilgisi buradan gelecek), üyelerin etkinliğe "katılacağım" bildirimi, oyun içinden otomatik veri çekme (KO'nun resmi API'si yok, tüm veri elle girilir).

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

Diğer bilgiler: Yeni sunuculara girişte **OTP zorunlu**. Yeni sunucularda **Ardream ve Ronark Land Base yok**, savaş yalnızca **Ronark Land (CZ)**'de. Sunucu isimleri ve level sınırı henüz açıklanmadı.

Tarihler tutarsız olduğu için kodda sabit yazılmaz: `milestones` tablosunda tutulur, yöneticiler Ayarlar sayfasından düzeltir. Aşama saatleri duyurulmadığı için `saat_belli=false` olan aşamalarda yalnızca gün gösterilir.

### L4BEL'in açılış planı

Yeni sunucuda klan adları boş; **L4BEL** adını ilk kuran alır. Panel bu adımları hazırlık listesinde ve ana sayfada takip eder.

| Ne zaman | Ne yapılır | Kim |
|---|---|---|
| Şimdi – 15 Ekim | Herkes telefon doğrulaması ve OTP'yi açar, panelde işaretler | Tüm üyeler |
| 15 – 29 Ekim | Ödüllü 1. ön kayıt | Tüm üyeler |
| 29 Ekim – 9 Kasım | Sunucu oylaması; herkes aynı sunucuyu seçer | Yönetim oylar, üyeler seçer |
| 10 – 11 Kasım | Nick'ler alınır (lider ve asistanlar öncelikli) | Tüm üyeler |
| 12 Kasım 16:00 | Lider klan kurma şartlarını en hızlı şekilde tamamlayıp **L4BEL**'i kurar; tutmazsa yedek ad kullanılır | Lider, asistanlar destek |
| Açılış sonrası | Üyeler klana davet edilir, panelde "L4BEL'e katıldım" işaretlenir | Asistanlar davet eder |

Klan kurma şartları (level, para vb.) yeni sunucu için açıklanınca bu tabloya eklenecek.

---

## 3. Kullanıcılar ve yetkiler

Giriş **Discord** ile yapılır. İki ayrı kavram var:

- **Rütbe** (oyundaki unvan, görüntü amaçlı): Lider, Asistan, Subay, Üye, Aday. Karaktere bağlıdır.
- **Yetki** (panelde ne yapabildiği): hesaba bağlıdır.

| Yetki | Kim | Yapabilir |
|---|---|---|
| `yonetici` | Lider, asistanlar | Her şey + yetki verme, açılış tarihleri, klan ayarları |
| `yetkili` | Subaylar | Üye/karakter düzenleme, davet kodu üretme ve iptal, etkinlik oluşturma, yoklama, duyuru |
| `uye` | Davet koduyla kayıt olanlar | Her şeyi görme, kendi hazırlık listesini işaretleme, **kendi karakterinin sınıf ve levelini güncelleme** |

Davet kodu olmadan yeni hesap açılmaz; ayrı bir "onay bekleniyor" durumu yok.

### Kayıt: davet kodu akışı

Yetkililer Ayarlar › Davet kodları'ndan kod üretir ve klan Discord'unda paylaşır. Kod biçimi `L4BEL-XXXX-XXXX` (karışabilecek 0/O, 1/I harfleri kullanılmaz).

| Adım | Ekran | Sunucu tarafında ne olur |
|---|---|---|
| 1 | **Davet kodu**: kodu yaz, "Devam et" | Kod doğrulanır (aktif mi, süresi dolmuş mu, kullanım sınırı dolmuş mu). Geçerliyse 15 dakikalık imzalı, `httpOnly` bir çerez yazılır. Hata mesajı tek tip: "Kod geçersiz ya da süresi dolmuş" (hangi koşulun tuttuğu söylenmez) |
| 2 | **Discord ile devam et** | Discord OAuth. Dönüşte (`/auth/callback`) çerez varsa `davet_kullan()` çalışır: kullanım sayısı satır kilidiyle artırılır, profil `uye` yetkisiyle ve kodun rütbesiyle (Üye ya da Aday) açılır, kullanım kaydı yazılır |
| 3 | **Karakterin**: nick, sınıf (level açılıştan sonra) | `characters` satırı oluşur. Nick benzersiz olmalı |
| 4 | **Hoş geldin**: sıradaki hazırlık adımları, "Panele git" | |

Zaten üye olan biri `/giris`'ten doğrudan Discord ile girer. Kodsuz ve kaydı olmayan biri Discord'la girmeye çalışırsa "Klana katılmak için davet kodu gerekli" sayfasına yönlenir.

Güvenlik:
- Kodun kendisi saklanmaz; `sha256(kod + gizli tuz)` saklanır. Liste ekranında yalnızca son 4 karakter görünür, tam kod yalnızca üretildiği anda bir kez gösterilir.
- Deneme sınırı: aynı IP için 15 dakikada 5 yanlış deneme, sonra bekleme.
- Her kodun süresi (varsayılan 7 gün), kullanım sınırı (varsayılan 25) ve iptal düğmesi var. Tek kişilik kod için kullanım sınırı 1.
- Kim hangi kodla katıldı, `invite_redemptions` tablosunda tutulur; yetkililer Ayarlar'dan görür.

### Profilim

Üye `/profil` sayfasından (üst bardaki adına tıklayarak da) **nick**'ini görür (kilitli alan) ve şunları değiştirir:
- **Sınıf:** açılıştan önce "planlanan sınıf", sonra oyundaki sınıf.
- **Level:** açılıştan önce kapalı. Açılıştan sonra 1 ile `clan_settings.level_siniri` arası tam sayı.

Nick, rütbe ve durum yetkililerdedir; nick oyunda farklı alındıysa üye bir yetkiliye yazar. Her değişiklik `character_changes` tablosuna yazılır (kim, hangi alan, eski ve yeni değer, zaman); yetkililer karakter detayında görür.

---

## 4. Teknoloji

| Katman | Seçim | Neden |
|---|---|---|
| Uygulama | **Next.js 16** (App Router, Server Actions) + TypeScript + React 19 | Tek repo, Vercel'de sıfır ayar |
| Stil | **Tailwind CSS 4**, tasarım token'ları `globals.css` içinde CSS değişkeni | Prototipteki token'lar birebir taşınır |
| Yazı tipleri | `next/font/google`: Cinzel (klan adı, başlık, geri sayım), Barlow Condensed (arayüz başlığı, etiket, sayı), Barlow (gövde) | Türkçe karakter desteği var |
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
characters          id, profile_id?, ad (unique), sinif, level?, rutbe, durum, ana_karakter, notlar, katilma_tarihi, guncellendi_at, guncelleyen
character_changes   id, character_id, alan (sinif | level | ...), eski, yeni, degistiren, created_at
hazirlik            profile_id (pk), otp, on_kayit, sunucu_secimi, karakter_adi, klana_katildi, updated_at
milestones          id, sira, baslik, baslangic, bitis?, saat_belli, aciklama, kaynak_url
event_types         kod (pk), ad, kisa_ad, yoklama_var        -- csw, bdw, juraid, chaos, ft, boss, toplanti
events              id, tur → event_types, baslik, baslangic, bitis?, aciklama, schedule_id?, olusturan, created_at
recurring_schedules id, tur, baslik, gun (0-6), saat, sure_dk, aktif     -- haftalık düzen
attendance          event_id + character_id (pk), durum, isaretleyen, updated_at
announcements       id, baslik, govde, sabit, discord_gonderildi_at?, yazar, created_at
clan_settings       tek satır: klan_adi, yedek_ad?, monogram, irk (karus | el_morad), sunucu_adi?, level_siniri?, discord_guild_id?
invite_codes        id, kod_hash (unique), son_dort, rutbe (uye | aday), max_kullanim, kullanim, bitis, aktif, not, olusturan, created_at
invite_redemptions  id, code_id, profile_id, created_at
```

Seed: `clan_settings` → `klan_adi = 'L4BEL'`, `monogram = 'L4'`. Klan adı kodda sabit yazılmaz; başlık, arma ve sayfa başlıkları bu satırdan okunur.

Enum'lar:
- `sinif`: warrior, rogue, mage, priest, kurian (El Morad'da Porutu; görüntülemede ırka göre ad değişir)
- `rutbe`: lider, asistan, subay, uye, aday

Terim: arayüzde karakter adı her yerde **Nick** olarak geçer (tablo başlığı, arama, kayıt ve profil formları); veritabanında sütun adı `characters.ad`.
- `durum` (karakter): aktif, izinli, pasif, ayrildi
- `yoklama`: katildi, gec, mazeretli, yok
- `yetki`: yonetici, yetkili, uye

RLS kuralları (özet):
- Okuma: `uye` ve üstü her tabloyu okur (`invite_codes` ve `invite_redemptions` hariç).
- Yazma: `characters`, `events`, `attendance`, `announcements`, `recurring_schedules` → `yetkili` ve üstü.
- Üyenin kendi karakteri: doğrudan tablo yazma yok; `profil_guncelle(sinif, level)` fonksiyonu (SECURITY DEFINER) yalnızca `profile_id = auth.uid()` olan satırın bu iki alanını değiştirir ve `character_changes`'e yazar.
- `hazirlik` → herkes yalnızca kendi satırını yazar.
- `invite_codes`, `invite_redemptions` → yalnızca `yetkili` ve üstü okur/yazar. Doğrulama ve kullanma `davet_dogrula(kod)` ve `davet_kullan(kod)` fonksiyonlarıyla, istemciye kod listesi hiç gitmez.
- `profiles.yetki`, `milestones`, `clan_settings` → yalnızca `yonetici`.

Katılım oranı = (katildi + gec) / işaretlenmiş yoklama sayısı. Mazeretli oranı düşürür ama ayrı gösterilir.

---

## 6. Sayfalar

| Yol | Sayfa | Prototipteki karşılığı |
|---|---|---|
| `/giris` | Discord ile giriş (mevcut üyeler) | yok |
| `/kayit` | Davet koduyla kayıt, 4 adım | Tuval: "Telefon · davet koduyla kayıt" |
| `/auth/callback` | OAuth dönüşü, davet kodunu kullanma | yok |
| `/profil` | Profilim: sınıf ve level | Profilim sekmesi, tuvalde "Telefon · profilim" |
| `/` | Genel bakış (geri sayım, aşamalar, hazırlık, yaklaşanlar, sabit duyuru) | Genel bakış |
| `/uyeler` | Üye tablosu, sınıf dağılımı, rütbe özeti | Üyeler |
| `/uyeler/[id]` | Karakter detayı, katılım geçmişi | yok |
| `/etkinlikler` | Etkinlik listesi, tür bazında katılım, en istikrarlı üyeler | Etkinlikler ve katılım |
| `/etkinlikler/[id]` | Yoklama ekranı | Etkinlikler (sağ panel) |
| `/takvim` | Aylık takvim, haftalık düzen | Takvim ve duyurular |
| `/duyurular` | Duyuru listesi ve yazma formu | Takvim ve duyurular |
| `/ayarlar` | Açılış tarihleri, klan bilgisi, level sınırı, yetkiler | yok |
| `/ayarlar/davet-kodlari` | Kod üret, listele (son 4 hane, kullanım, bitiş), iptal et, kimin hangi kodla katıldığı | yok |

Tasarım kuralları [`design/palet.md`](../design/palet.md)'den gelir: tek koyu tema; marka rengi ırka göre (`data-irk`: Karus kırmızı-bordo, El Morad mavi-lacivert) ve birincil butonda, armada, aktif sekmede kullanılır; eski altın ödül, ilerleme ve öne çıkan sayılar için; rütbeler maden sırasıyla (altın, gümüş, bronz, demir); sınıf renkleri grafik serisinin ilk beşi, her zaman yazıyla birlikte; durumlar renk + ikon + etiketle. Üst barda kalkan içinde "L4" monogramı ve "L4BEL" yazısı.

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
2. `app/globals.css`: `design/tokens.css`'teki tüm renk ve yazı token'ları (tek koyu tema, ırk `clan_settings.irk`'ten `data-irk` olarak).
3. Ortak arayüz parçaları `components/ui/`: Panel, Button, Tag, Pill (durum), ClassChip, Segmented, DateBlock, Meter, Tooltip, Toast.
4. Uygulama kabuğu `app/(panel)/layout.tsx`: arma + klan adı, sekmeler, kullanıcı rozeti; her sayfa için boş yer tutucu.
5. `supabase/migrations/0001_init.sql` (tüm şema + RLS + `profil_guncelle`, `davet_dogrula`, `davet_kullan` fonksiyonları + seed: event_types, milestones, clan_settings) ve `lib/database.types.ts`.
6. Veri katmanı arayüzleri `lib/data/*.ts` (fonksiyon imzaları + demo adaptörü) ve `lib/demo/fixtures.ts` (klan adı L4BEL, prototipteki örnek üyeler).
7. `lib/auth.ts`: `getCurrentUser()`, `requireYetki(min)`; `/auth/callback` içinde davet çerezini okuyup `davet_kullan()` çağırma; demo modunda prototipteki "Yetkili / Üye" anahtarı gibi çerezle değişen sahte kullanıcı.
8. `lib/time.ts`: TSİ biçimlendirme, "3 gün sonra" gibi göreli tarih, açılış öncesi/sonrası tespiti (birim testli).
9. GitHub Actions: lint, typecheck, test, build.
10. `README.md`: yerel çalıştırma (demo modu), ortam değişkenleri.

### Faz 1: Paralel oturumlar

Her oturum Faz 0'ın birleştiği `main` dalından başlar, kendi dalında çalışır ve PR açar. **Yalnızca kendi klasörlerine yazar.** Ortak dosyada değişiklik gerekiyorsa (ör. `components/ui`) PR açıklamasında belirtir, kendisi değiştirmez; ihtiyaç Faz 2'de toplanır.

| Oturum | Dal | Sahip olduğu dosyalar | Kabul kriterleri |
|---|---|---|---|
| **A: Üyeler + Profilim** | `feat/uyeler` | `app/(panel)/uyeler/**`, `app/(panel)/profil/**`, `components/uyeler/**`, `lib/data/members.ts` (supabase adaptörü) | Filtre + arama, sınıf dağılımı, rütbe özeti, hazırlık sütunu (açılış öncesi) / level sütunu (sonrası), karakter ekle-düzenle formu (Server Action + doğrulama), karakter detayında katılım geçmişi ve değişiklik kaydı; Profilim: sınıf seçimi, level (açılış öncesi kapalı, 1..level sınırı), kaydedince üye listesine yansıma, başkasının profilini değiştirememe testi |
| **B: Etkinlik + yoklama** | `feat/etkinlikler` | `app/(panel)/etkinlikler/**`, `components/etkinlikler/**`, `lib/data/events.ts`, `lib/data/attendance.ts` | Yaklaşan/geçmiş listesi, etkinlik oluştur-düzenle, yoklama ekranı (tek tıkla işaretleme, iyimser güncelleme, toplu işlemler), tür bazında katılım grafiği, en istikrarlı 5 üye, üyeler için salt okunur görünüm |
| **C: Takvim + duyurular** | `feat/takvim-duyurular` | `app/(panel)/takvim/**`, `app/(panel)/duyurular/**`, `components/takvim/**`, `components/duyurular/**`, `lib/data/announcements.ts`, `lib/data/schedule.ts`, `lib/discord/**` | Aylık takvim + telefonda ajanda, haftalık düzen düzenleme ve "bu haftanın etkinliklerini oluştur", duyuru yaz/sabitle/sil, Discord webhook gönderimi (hata durumunda yeniden dene + kullanıcıya açık mesaj), webhook birim testi (fetch mock) |
| **D: Genel bakış + ayarlar + kayıt** | `feat/genel-ayarlar` | `app/(panel)/page.tsx`, `app/(panel)/ayarlar/**`, `app/kayit/**`, `app/giris/**`, `components/genel/**`, `components/kayit/**`, `lib/data/milestones.ts`, `lib/data/prep.ts`, `lib/data/settings.ts`, `lib/data/invites.ts` | Geri sayım (istemci bileşeni, saniyelik), aşama zaman çizelgesi, klan hazırlığı + "benim hazırlığım" (açılıştan sonra "L4BEL'e katıldım" adımı eklenir), açılış sonrası özet kutuları; Kayıt: 4 adımlı akış (kod, Discord, karakter, hoş geldin), tek tip hata mesajı, deneme sınırı; Ayarlar: açılış tarihleri, klan adı/ırk, level sınırı, yetki verme, davet kodu üret/listele/iptal |

Ortak kurallar:
- Her oturum bitmeden önce `lint`, `typecheck`, `test`, `build` temiz geçmeli.
- Demo modunda ekranlar prototiple aynı düzende olmalı; PR'a ekran görüntüsü (masaüstü + 400px telefon) eklenmeli.
- Metinler Türkçe, saatler TSİ.
- Başka oturumun klasörüne dokunulmaz.

### Faz 2: Entegrasyon ve yayın (1 oturum)

1. PR'ları sırayla birleştir (A → B → C → D), çakışmaları çöz, ortak bileşen isteklerini topla.
2. Playwright duman testi (demo modunda tüm sayfalar, iki ırk rengi, telefon genişliği, davet koduyla kayıt akışı).
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

Klan adı netleşti: **L4BEL**.

1. Arma: şimdilik kalkan içinde "L4" monogramı. Klanın bir logosu var mı?
2. Yedek klan adı ne olsun? (Açılışta L4BEL başkası tarafından alınırsa)
3. Irk: Karus mu El Morad mı? (Sınıf adları ve renk vurgusu buna göre)
4. Rütbe adları prototipteki gibi mi kalsın (Lider, Asistan, Subay, Üye, Aday)?
5. Davet kodları varsayılan olarak kaç gün geçerli olsun, kaç kişi kullanabilsin? (Öneri: 7 gün, 25 kullanım)
6. Haftalık etkinlik saatleri sunucu açılınca belli olacak; prototipteki saatler örnek.
