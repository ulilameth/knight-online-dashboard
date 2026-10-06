# L4BEL Klan Paneli

L4BEL klanının Knight Online yeni sunucuları (12 Kasım 2026) için kullanacağı klan içi panel: açılış geri sayımı, üye listesi ve roller, etkinlik katılım takibi, takvim ve duyurular, karakter tasarımı.

- Plan: [`docs/PLAN.md`](docs/PLAN.md)
- Tasarım prototipi: [`design/prototype.html`](design/prototype.html) (tarayıcıda doğrudan açılır). Yayını: https://ulilameth.github.io/knight-online-dashboard/ ([`.github/workflows/pages.yml`](.github/workflows/pages.yml); site herkese açıktır, giriş ekranı yalnızca örnek)

## Uygulama

Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind 4, veri ve giriş Supabase (Postgres + Auth + RLS). Durum: **Faz 0 tamam** (altyapı, veritabanı, veri katmanı, giriş ve kayıt); ekranların çoğu Faz 1'de.

### Yerel çalıştırma (demo modu)

Supabase gerekmez; örnek klan verisiyle bellekte çalışır.

```bash
npm install
npm run dev          # http://localhost:3000
```

Demo hesapları (şifre `demo1234`): **KaraBey** (yönetici), **DemirYumruk** (yetkili), **GeceKuşu** (üye). Kayıt için davet kodu `L4BEL-DEMO-2026`. Açılış sonrası ekranları görmek için `.env.local`'a `DEMO_SIMDI=2026-11-21T19:40`.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run lint` / `npm run typecheck` | ESLint, TypeScript |
| `npm test` | Vitest. `DATABASE_URL` verilirse veritabanı testleri de gerçek Postgres'te çalışır |
| `npm run db:tipler` | `lib/database.types.ts`'i migration'dan üretir (`DATABASE_URL` gerekir) |
| `npm run build` | Üretim derlemesi |

Veritabanı testleri için yerel Postgres: `DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm test`. Testler geçici bir veritabanı açar, `supabase/tests/supabase-stub.sql` (Supabase'in rolleri ve `auth.uid()` taklidi) ve migration'ı uygular, sonra siler. CI'da aynısı Postgres 16 servisiyle çalışır.

### Ortam değişkenleri

[`.env.example`](.env.example)'a bak. `DATA_SOURCE=supabase` için `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (gizli, yalnızca sunucuda) ve `KAYIT_IMZA_ANAHTARI` (en az 32 karakter rastgele) gerekir.

### Vercel'e yayın (demo modu)

Supabase olmadan, örnek klan verisiyle herkesin açıp gezebileceği bir adres:

1. vercel.com'da GitHub hesabınla giriş yap › **Add New › Project** › `knight-online-dashboard` reposunu seç › **Import**.
2. Ayarlara dokunma (Framework: Next.js, komutlar `package.json`'dan gelir). Ortam değişkeni girmeden **Deploy**'a bas: `DATA_SOURCE` yoksa uygulama demo modunda çalışır.
3. Production adresi varsayılan daldan (`claude/relaxed-galileo-qvzykz`) yayınlanır; her PR'ın kendi önizleme adresi olur (PR sayfasında Vercel botu yazar).

Demo hesapları giriş sayfasında yazar (şifre `demo1234`, davet kodu `L4BEL-DEMO-2026`). Demo verisi sunucunun belleğinde durur: yapılan kayıtlar ve değişiklikler kalıcı değildir, sunucu yeniden başlayınca (yeni yayın ya da bir süre kullanılmayınca) örnek veriye döner. Sunucu bölgesi `vercel.json`'da Frankfurt (`fra1`). Arama motorları siteyi dizine eklemez (`robots: noindex`).

Gerçek klan verisi için aşağıdaki Supabase kurulumundan sonra Vercel › Settings › Environment Variables'a `.env.example`'daki değişkenler girilir ve `DATA_SOURCE=supabase` yapılır.

### Supabase kurulumu

1. supabase.com'da proje aç. Authentication › Providers › Email: **Confirm email kapalı** (iç e-postalar gerçek değil).
2. SQL Editor'da [`supabase/migrations/`](supabase/migrations/) altındaki dosyaları sırayla çalıştır: `0001_init.sql`, sonra `0002_esya_gorselleri.sql` (ya da Supabase CLI ile `supabase db push`).
3. Eşya kataloğu: [`supabase/seed.sql`](supabase/seed.sql)'i çalıştır (770 eşya, 9.156 derece satırı, setler; ~1,5 MB). SQL Editor'a yapıştırmak ağır gelirse `psql "<bağlantı adresi>" -f supabase/seed.sql`; Supabase CLI `supabase db reset` kendisi uygular. Tekrar çalıştırılabilir: KO Bugda eşyaları güncellenir, elle eklenenlere (id 1.000.000+) dokunulmaz.
4. İlk yönetici: [`scripts/ilk-yonetici.sql`](scripts/ilk-yonetici.sql)'deki adımlar (kurucu davet kodu üret, `/kayit`'ten kaydol, kendini yönetici yap).
5. Vercel'de repoyu bağla, ortam değişkenlerini gir, `DATA_SOURCE=supabase`.

### Yapı

| Yol | İçerik |
|---|---|
| `supabase/migrations/` | Şema, RLS kuralları, kayıt/giriş/davet/sıfırlama fonksiyonları, başlangıç verisi |
| `supabase/seed.sql` | Eşya kataloğu; `npm run db:seed` ile `design/katalog.json`'dan üretilir (elle düzenlenmez, CI güncelliğini denetler) |
| `supabase/tests/` | Veritabanı testleri (yetki kuralları, katalog seed'i) |
| `lib/data/` | Veri katmanı: her alan için arayüz + demo + Supabase uygulaması; giriş noktası `veri()` |
| `lib/giris.ts`, `lib/auth*.ts`, `lib/actions/auth.ts` | Nick + şifreyle giriş, davet koduyla kayıt, şifre sıfırlama, oturum |
| `lib/rules/` | Karakter tasarımı kuralları: stat/skill havuzu, ağaç sınırları, build denetimi (sunucu ve planlayıcı aynısını kullanır) |
| `lib/katalog/` | `design/katalog.json` → veritabanı satırları (seed ve demo aynı dönüşümü kullanır) |
| `lib/demo/` | Demo verisi ve bellekteki depo |
| `lib/time.ts` | TSİ biçimlendirme, göreli zaman, açılış |
| `app/(panel)/` | Giriş gerektiren sayfalar; `app/(hesap)/` giriş, kayıt, şifre sıfırlama |
| `proxy.ts` | Oturum yenileme ve oturumsuz istekleri `/giris`'e yönlendirme |
