# L4BEL Klan Paneli

L4BEL klanının Knight Online yeni sunucuları (12 Kasım 2026) için kullanacağı klan içi panel: açılış geri sayımı, üye listesi ve roller, etkinlik katılım takibi, takvim ve duyurular (TeamSpeak'e gönderim), karakter tasarımı ve eşya kataloğu.

- Plan: [`docs/PLAN.md`](docs/PLAN.md)
- Tasarım prototipi: [`design/prototype.html`](design/prototype.html) (tarayıcıda doğrudan açılır). Yayını: https://ulilameth.github.io/knight-online-dashboard/ ([`.github/workflows/pages.yml`](.github/workflows/pages.yml))

Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind 4; veri ve giriş Supabase (Postgres + Auth + RLS). Supabase olmadan **demo modunda** da tamamen çalışır.

## Kendi bilgisayarında çalıştırma

Gerekenler: **Node.js 22+** ve npm. Yerel Supabase için ayrıca **Docker** (Docker Desktop ya da OrbStack).

```bash
git clone https://github.com/ulilameth/knight-online-dashboard.git
cd knight-online-dashboard
npm install
```

### 1. Demo modu (en kolayı)

Supabase gerekmez; örnek klan verisi sunucunun belleğinde tutulur (sunucuyu kapatınca sıfırlanır).

```bash
npm run dev          # http://localhost:3000
```

| Hesap (şifre `demo1234`) | Panel yetkisi |
|---|---|
| **KaraBey** (Lider), Asena, SessizOk | Yönetici: her şey, klan bilgisi ve yetkiler dahil |
| **DemirYumruk**, AlevBüyü, ŞifaEli | Yetkili: üye, etkinlik, yoklama, duyuru, davet kodu |
| **GeceKuşu**, Bozkurt, Kartal ve diğerleri | Üye |

Kayıt için davet kodu: `L4BEL-DEMO-2026`.

Panel açılıştan önce ve sonra farklı görünür (geri sayım ve hazırlık, ya da level, savaş katılımı ve haftalık düzen). Açılış sonrasını görmek için `.env.local` dosyası açıp şunu yaz, sonra sunucuyu yeniden başlat:

```bash
DEMO_SIMDI=2026-11-21T19:40
```

### 2. Yerel Supabase (gerçek veritabanıyla)

Docker açıkken:

```bash
npm run db:baslat    # Supabase'i Docker'da başlatır; şema ve örnek veri (supabase/seed.sql) yüklenir
npm run db:env       # .env.local'ı yerel Supabase'in adres ve anahtarlarıyla yazar (DATA_SOURCE=supabase)
npm run dev          # http://localhost:3000
```

Hesaplar ve davet kodu demo moduyla aynıdır (şifre `demo1234`). Veritabanını tarayıcıda görmek için Supabase Studio: http://127.0.0.1:54323.

| Komut | Ne yapar |
|---|---|
| `npm run db:sifirla` | Veritabanını sıfırlar: şema ve örnek veri baştan yüklenir |
| `npm run db:durdur` | Supabase konteynerlerini durdurur (veri korunur) |
| `npm run db:env -- --zorla` | Var olan `.env.local`'ın üzerine yazar |

Demo moduna dönmek için `.env.local`'daki `DATA_SOURCE=supabase` satırını `DATA_SOURCE=demo` yap.

### 3. Testler

```bash
npm run lint && npm run typecheck
npm test                                  # birim testleri
npx playwright install chromium           # bir kez: uçtan uca testlerin tarayıcısı
npm run build && npm run e2e              # uçtan uca testler (demo modunda iki sunucu açar: 3210 ve 3211)
```

Veritabanı testleri (yetki kuralları ve fonksiyonlar) gerçek Postgres ister; yerel Supabase açıkken:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres npm test
```

Testler geçici bir veritabanı açar, [`supabase/tests/supabase-stub.sql`](supabase/tests/supabase-stub.sql) ve migration'ı uygular, sonra siler. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) her push'ta lint, tip denetimi, birim ve veritabanı testleri, uçtan uca testler ve derlemeyi çalıştırır.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi ve sunucusu |
| `npm run lint` / `npm run typecheck` | ESLint, TypeScript |
| `npm test` | Vitest (`DATABASE_URL` verilirse veritabanı testleri de) |
| `npm run e2e` | Playwright uçtan uca testleri (önce `npm run build`) |
| `npm run db:tipler` | `lib/database.types.ts`'i migration'dan üretir (`DATABASE_URL` gerekir) |
| `npm run db:seed` | `supabase/seed.sql`'i demo verisinden üretir |
| `npm run varliklar` | Eşya kataloğu ve görsellerini `public/`'e kopyalar (`dev` ve `build` öncesi kendiliğinden) |

## Ortam değişkenleri

Hepsi [`.env.example`](.env.example)'da açıklamalı.

| Değişken | Ne için |
|---|---|
| `DATA_SOURCE` | `demo` (varsayılan) ya da `supabase` |
| `DEMO_SIMDI` | Yalnızca demo: şimdiki zaman (TSİ), ör. `2026-11-21T19:40` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase adresi ve anonim anahtarı |
| `SUPABASE_SERVICE_ROLE_KEY` | Gizli, yalnızca sunucuda: kayıt, giriş, şifre işlemleri |
| `KAYIT_IMZA_ANAHTARI` | Kayıt adımları arasındaki çerezi imzalar; en az 32 karakter rastgele (`openssl rand -base64 32`) |
| `TS3_WEBQUERY_URL`, `TS3_WEBQUERY_KEY`, `TS3_SANAL_SUNUCU` | İsteğe bağlı: duyuruları TeamSpeak 3'e (3.12+) gönderme. Yoksa "TeamSpeak'e de gönder" kutusu gizlenir, "Metni kopyala" kalır |

## Yayına alma (Supabase + Vercel)

1. supabase.com'da proje aç. Authentication › Providers › Email: **Confirm email kapalı** (iç e-postalar gerçek değil), Authentication › Settings: **Allow new users to sign up kapalı** (kayıt yalnızca davet koduyla, sunucu tarafında).
2. Şemayı yükle: SQL Editor'da [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)'i çalıştır ya da `npx supabase link` + `npx supabase db push`. Örnek veriyi (`seed.sql`) gerçek projeye **yükleme**.
3. İlk yönetici: [`scripts/ilk-yonetici.sql`](scripts/ilk-yonetici.sql)'deki adımlar (kurucu davet kodu üret, `/kayit`'ten kaydol, kendini yönetici yap).
4. Vercel'de repoyu bağla; ortam değişkenlerini gir ve `DATA_SOURCE=supabase` yap.
5. İsteğe bağlı TeamSpeak: TS sunucusunda WebQuery'yi aç, ServerQuery ile `apikeyadd scope=manage lifetime=0` anahtar üret, `TS3_WEBQUERY_URL` (`http://sunucu:10080` ya da `https://sunucu:10443`) ve `TS3_WEBQUERY_KEY`'i Vercel'e gir.

## Yapı

| Yol | İçerik |
|---|---|
| `app/(panel)/` | Giriş gerektiren sayfalar: genel bakış, üyeler (+ detay), etkinlikler, takvim, karakter, eşyalar, profil, ayarlar |
| `app/(hesap)/` | Giriş, davet koduyla kayıt (4 adım), şifre sıfırlama |
| `components/` | Ekran bileşenleri (`ui/` ortak parçalar, `kabuk/` başlık ve sekmeler) |
| `lib/actions/` | Server Action'lar (form ve düğmelerin sunucu tarafı) |
| `lib/data/` | Veri katmanı: her alan için arayüz + demo + Supabase uygulaması; giriş noktası `veri()` |
| `lib/oyun/` | Karakter tasarımı: eşya kataloğu, AP/HP/MP/savunma hesabı, set bonusları, planlayıcı mantığı |
| `lib/teamspeak/` | TeamSpeak WebQuery ile duyuru gönderimi |
| `lib/demo/` | Demo verisi ve bellekteki depo |
| `lib/time.ts` | TSİ biçimlendirme, göreli zaman, açılış |
| `supabase/` | Migration (şema, RLS, fonksiyonlar), örnek veri, yerel Supabase ayarı, veritabanı testleri |
| `e2e/` | Playwright uçtan uca testleri (`once/` açılış öncesi, `sonra/` açılış sonrası) |
| `design/` | Prototip, tasarım token'ları, eşya kataloğu (`katalog.json`) |
| `proxy.ts` | Oturum yenileme ve oturumsuz istekleri `/giris`'e yönlendirme |
