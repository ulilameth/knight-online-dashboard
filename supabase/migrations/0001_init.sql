-- L4BEL klan paneli: ilk şema (docs/PLAN.md §5).
-- Supabase Postgres 15+; auth.users ve auth.uid() Supabase'den gelir (yerel testte supabase/tests/supabase-stub.sql).
-- Yetki kuralları RLS ile veritabanında; istemciye açık olmayan işlemler SECURITY DEFINER fonksiyonlarında.

-- ---------------------------------------------------------------------------
-- 1. Türler
-- ---------------------------------------------------------------------------
-- Sıra önemli: yetki karşılaştırmaları (yetki >= 'yetkili') enum sırasına göre yapılır.
create type public.yetki as enum ('uye', 'yetkili', 'yonetici');
create type public.sinif as enum ('warrior', 'rogue', 'mage', 'priest', 'kurian');
create type public.rutbe as enum ('lider', 'asistan', 'subay', 'uye', 'aday');
create type public.karakter_durum as enum ('aktif', 'izinli', 'pasif', 'ayrildi');
create type public.yoklama as enum ('katildi', 'gec', 'mazeretli', 'yok');
create type public.taraf as enum ('karus', 'el_morad');
create type public.gorunurluk as enum ('klan', 'gizli');
create type public.esya_derecesi as enum ('normal', 'set', 'unique', 'rare', 'draki', 'cospre');

-- ---------------------------------------------------------------------------
-- 2. İstemciye kapalı şema: kod tuzu ve deneme sayaçları
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;

create table private.gizli_ayarlar (
  anahtar text primary key,
  deger text not null
);
insert into private.gizli_ayarlar (anahtar, deger)
values ('kod_tuzu', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''));

-- Giriş, davet kodu ve sıfırlama denemeleri (anahtar: 'giris:<nick>', 'davet:<ip>' gibi)
create table private.denemeler (
  anahtar text not null,
  zaman timestamptz not null default now()
);
create index denemeler_anahtar_zaman on private.denemeler (anahtar, zaman);

-- ---------------------------------------------------------------------------
-- 3. Tablolar
-- ---------------------------------------------------------------------------
create table public.clan_settings (
  id boolean primary key default true check (id),
  klan_adi text not null,
  yedek_ad text,
  monogram text not null check (char_length(monogram) between 1 and 3),
  irk public.taraf not null default 'karus',
  sunucu_adi text,
  ts_adres text not null,
  acilis_at timestamptz not null,                 -- sunucu açılışı; öncesinde level girilmez
  level_siniri smallint not null default 80 check (level_siniri in (80, 83)),
  reb_siniri smallint not null default 0 check (reb_siniri between 0 and 10),
  updated_at timestamptz not null default now(),
  check (level_siniri = 83 or reb_siniri = 0)
);

create table public.race_stats (
  irk_turu text primary key,
  ad text not null,
  taraf public.taraf not null,
  siniflar public.sinif[] not null,
  str smallint not null,
  hp smallint not null,
  dex smallint not null,
  int smallint not null,
  mp smallint not null,
  dogrulandi boolean not null default false
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  ts_nick text check (char_length(ts_nick) <= 30),
  yetki public.yetki not null default 'uye',
  son_giris timestamptz,
  created_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  ad text not null check (char_length(ad) between 2 and 20 and ad !~ '\s'),
  sinif public.sinif,
  irk_turu text references public.race_stats (irk_turu),
  level smallint check (level between 1 and 83),
  reb smallint not null default 0 check (reb between 0 and 10),
  rutbe public.rutbe not null default 'uye',
  durum public.karakter_durum not null default 'aktif',
  ana_karakter boolean not null default true,
  ekipman_gorunur public.gorunurluk not null default 'klan',
  notlar text,
  katilma_tarihi date not null default current_date,
  guncellendi_at timestamptz not null default now(),
  guncelleyen uuid references public.profiles (id) on delete set null,
  check (reb = 0 or level = 83)
);
create unique index characters_ad_key on public.characters (lower(ad));
create unique index characters_tek_ana on public.characters (profile_id) where ana_karakter;

create table public.character_changes (
  id bigint generated always as identity primary key,
  character_id uuid not null references public.characters (id) on delete cascade,
  alan text not null,
  eski text,
  yeni text,
  degistiren uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index character_changes_karakter on public.character_changes (character_id, created_at desc);

create table public.hazirlik (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  otp boolean not null default false,
  on_kayit boolean not null default false,
  sunucu_secimi boolean not null default false,
  karakter_adi boolean not null default false,
  klana_katildi boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.milestones (
  id smallint generated always as identity primary key,
  sira smallint not null,
  baslik text not null,
  baslangic timestamptz not null,
  bitis timestamptz,
  saat_belli boolean not null default false,       -- false: yalnızca gün gösterilir
  aciklama text,
  kaynak_url text,
  check (bitis is null or bitis >= baslangic)
);

create table public.event_types (
  kod text primary key,
  ad text not null,
  kisa_ad text not null,
  yoklama_var boolean not null default true
);

create table public.recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  tur text not null references public.event_types (kod),
  baslik text not null,
  gun smallint not null check (gun between 0 and 6),   -- 0 pazar
  saat time not null,                                  -- TSİ
  sure_dk smallint not null default 60 check (sure_dk > 0),
  aktif boolean not null default true
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  tur text not null references public.event_types (kod),
  baslik text not null check (char_length(baslik) <= 120),
  baslangic timestamptz not null,
  bitis timestamptz,
  aciklama text,
  schedule_id uuid references public.recurring_schedules (id) on delete set null,
  olusturan uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (bitis is null or bitis > baslangic)
);
create index events_baslangic on public.events (baslangic);

create table public.attendance (
  event_id uuid not null references public.events (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  durum public.yoklama not null,
  isaretleyen uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (event_id, character_id)
);
create index attendance_karakter on public.attendance (character_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  baslik text not null check (char_length(baslik) <= 120),
  govde text not null check (char_length(govde) <= 4000),
  sabit boolean not null default false,
  ts_gonderildi_at timestamptz,
  yazar uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  kod_hash text not null unique,
  son_dort text not null,
  rutbe public.rutbe not null default 'uye' check (rutbe in ('uye', 'aday')),
  max_kullanim smallint not null default 25 check (max_kullanim between 1 and 500),
  kullanim smallint not null default 0,
  bitis timestamptz not null,
  aktif boolean not null default true,
  aciklama text check (char_length(aciklama) <= 120),
  olusturan uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (kullanim between 0 and max_kullanim)
);

create table public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.invite_codes (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.password_resets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kod_hash text not null,
  bitis timestamptz not null,
  kullanildi_at timestamptz,
  olusturan uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index password_resets_profil on public.password_resets (profile_id);

-- Karakter tasarımı: kurallar ve eşya kataloğu (scripts/katalog_olustur.py verisinden doldurulur)
create table public.game_rules (
  anahtar text primary key,
  deger jsonb not null,
  dogrulandi boolean not null default false,
  kaynak text
);

create table public.class_trees (
  sinif public.sinif not null,
  sira smallint not null check (sira between 1 and 4),   -- 4: master
  ad text not null,
  primary key (sinif, sira)
);

create table public.item_sets (
  anahtar text primary key,                  -- parça kimlikleri, ör. '321,322,323,324,325'
  ad text not null,
  aile text,                                 -- eski KO Bugda aile tablosu (KROWAZ, BASIC, ...)
  parcalar integer[] not null,
  bonus_tablosu jsonb                        -- kobugda.com/sets: {sinif: {parça_biti: [bonus...]}}
);

-- Eski KO Bugda aile tabloları: tablo = '<SINIF>_<AILE>', maske = takılı parçaların bit toplamı
create table public.item_set_bonuses (
  tablo text not null,
  maske smallint not null check (maske between 1 and 31),
  bonus jsonb not null,
  primary key (tablo, maske)
);

create table public.items (
  id integer primary key,                    -- KO Bugda kimliği; elle eklenenler 1.000.000'dan başlar
  ad text not null,                          -- sahibinin nick'ini taşıyanlarda {ad} yer tutucusu
  kategori text not null,
  yuvalar text[] not null,
  siniflar public.sinif[] not null default '{}',   -- boş: herkes
  derece public.esya_derecesi not null default 'normal',
  set_anahtari text references public.item_sets (anahtar) on delete set null,
  set_parcasi jsonb,                         -- [aile, parça_biti]
  etki text,
  gorsel text,
  kaynak text not null default 'kobugda',
  updated_at timestamptz not null default now()
);

create table public.item_stats (
  item_id integer not null references public.items (id) on delete cascade,
  arti smallint not null check (arti between 0 and 31),
  degerler jsonb not null,                   -- {"AttackPower": 134, "BonusDexterity": 5, ...}
  primary key (item_id, arti)
);

create table public.builds (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters (id) on delete cascade,
  ad text not null default 'Build' check (char_length(ad) <= 60),
  sinif public.sinif not null,
  irk_turu text references public.race_stats (irk_turu),
  level smallint not null check (level between 1 and 83),
  reb smallint not null default 0 check (reb between 0 and 10),
  statlar jsonb not null default '{"str": 0, "hp": 0, "dex": 0, "int": 0, "mp": 0}',
  skiller smallint[] not null default '{0,0,0,0}' check (cardinality(skiller) = 4),
  ekipman jsonb not null default '{}',       -- {yuva: {item_id, arti}}
  ap_girdileri jsonb not null default '{}',
  sablon boolean not null default false,
  olusturan uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  check (sablon or character_id is not null)
);
-- Karakter başına tek kayıtlı build (Üyeler › Ekipman); şablonlar karaktere bağlı değil
create unique index builds_karakter on public.builds (character_id) where not sablon;

-- ---------------------------------------------------------------------------
-- 4. Yardımcı fonksiyonlar ve tetikleyiciler
-- ---------------------------------------------------------------------------
create function public.yetki_var(en_az public.yetki)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.yetki >= en_az from public.profiles p where p.id = auth.uid()), false);
$$;

create function public.karakterim(p_character_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.characters c where c.id = p_character_id and c.profile_id = auth.uid());
$$;

create function private.kod_hash(p_kod text)
returns text
language sql stable security definer set search_path = ''
as $$
  select encode(sha256(convert_to(
    upper(regexp_replace(p_kod, '\s', '', 'g')) || (select deger from private.gizli_ayarlar where anahtar = 'kod_tuzu'),
    'UTF8')), 'hex');
$$;

-- Karışabilecek 0/O ve 1/I olmadan 32 harflik alfabeden rastgele dizi (gen_random_uuid güçlü rastgele kaynak kullanır)
create function private.rastgele_kod(p_uzunluk int)
returns text
language plpgsql volatile set search_path = ''
as $$
declare
  alfabe constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea;
  sonuc text := '';
begin
  while char_length(sonuc) < p_uzunluk loop
    b := uuid_send(gen_random_uuid());
    -- 6-9. baytlarda uuid sürüm bitleri var; yalnızca tamamen rastgele baytlar kullanılır
    for i in 0..15 loop
      continue when i between 6 and 9;
      exit when char_length(sonuc) >= p_uzunluk;
      sonuc := sonuc || substr(alfabe, get_byte(b, i) % 32 + 1, 1);
    end loop;
  end loop;
  return sonuc;
end;
$$;

create function public.updated_at_yaz()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger builds_updated_at before update on public.builds for each row execute function public.updated_at_yaz();
create trigger hazirlik_updated_at before update on public.hazirlik for each row execute function public.updated_at_yaz();
create trigger attendance_updated_at before update on public.attendance for each row execute function public.updated_at_yaz();
create trigger clan_settings_updated_at before update on public.clan_settings for each row execute function public.updated_at_yaz();
create trigger items_updated_at before update on public.items for each row execute function public.updated_at_yaz();

-- Karakter değişikliği: zaman ve değiştireni yaz, izlenen alanları character_changes'e kaydet
create function public.karakter_guncellendi()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  alan text;
  eski jsonb := to_jsonb(old);
  yeni jsonb := to_jsonb(new);
begin
  if tg_op = 'UPDATE' and tg_when = 'BEFORE' then
    new.guncellendi_at := now();
    new.guncelleyen := coalesce(auth.uid(), new.guncelleyen);
    return new;
  end if;
  foreach alan in array array['ad', 'sinif', 'level', 'reb', 'rutbe', 'durum', 'ana_karakter', 'profile_id'] loop
    if eski -> alan is distinct from yeni -> alan then
      insert into public.character_changes (character_id, alan, eski, yeni, degistiren)
      values (new.id, alan, eski ->> alan, yeni ->> alan, auth.uid());
    end if;
  end loop;
  return null;
end;
$$;

create trigger characters_zaman before update on public.characters for each row execute function public.karakter_guncellendi();
create trigger characters_kayit after update on public.characters for each row execute function public.karakter_guncellendi();

-- Deneme sınırı (yalnızca sunucu, service role): son p_pencere içinde p_sinir denemeye ulaşıldı mı
create function public.deneme_asildi(p_anahtar text, p_sinir int default 5, p_pencere interval default interval '15 minutes')
returns boolean
language sql stable security definer set search_path = ''
as $$
  select count(*) >= p_sinir from private.denemeler where anahtar = p_anahtar and zaman > now() - p_pencere;
$$;

create function public.deneme_kaydet(p_anahtar text)
returns void
language sql security definer set search_path = ''
as $$
  delete from private.denemeler where zaman < now() - interval '1 day';
  insert into private.denemeler (anahtar) values (p_anahtar);
$$;

create function public.deneme_temizle(p_anahtar text)
returns void
language sql security definer set search_path = ''
as $$
  delete from private.denemeler where anahtar = p_anahtar;
$$;

-- ---------------------------------------------------------------------------
-- 5. Davet kodu, kayıt, giriş, şifre sıfırlama
-- ---------------------------------------------------------------------------
-- İzin denetimi olmadan kod üretir; yalnızca davet_olustur ve kurulum betiği (scripts/ilk-yonetici.sql) kullanır.
create function private.davet_kodu_uret(p_rutbe public.rutbe, p_gun int, p_max int, p_aciklama text, p_olusturan uuid)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  onek text := upper(regexp_replace((select klan_adi from public.clan_settings), '[^A-Za-z0-9]', '', 'g'));
  kod text;
begin
  if p_rutbe not in ('uye', 'aday') then
    raise exception 'Davet kodu yalnızca Üye ya da Aday rütbesi verir' using errcode = 'check_violation';
  end if;
  if p_gun not between 1 and 90 then
    raise exception 'Geçerlilik 1 ile 90 gün arası olmalı' using errcode = 'check_violation';
  end if;
  kod := coalesce(nullif(onek, ''), 'KLAN') || '-' || private.rastgele_kod(4) || '-' || private.rastgele_kod(4);
  insert into public.invite_codes (kod_hash, son_dort, rutbe, max_kullanim, bitis, aciklama, olusturan)
  values (private.kod_hash(kod), right(kod, 4), p_rutbe, p_max, now() + make_interval(days => p_gun), p_aciklama, p_olusturan);
  return kod;
end;
$$;

-- Yetkili kod üretir; tam kod yalnızca burada bir kez döner, veritabanında hash'i durur.
create function public.davet_olustur(p_rutbe public.rutbe default 'uye', p_gun int default 7, p_max int default 25, p_aciklama text default null)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.yetki_var('yetkili') then
    raise exception 'Bu işlem için yetkili olmalısın' using errcode = 'insufficient_privilege';
  end if;
  return private.davet_kodu_uret(p_rutbe, p_gun, p_max, p_aciklama, auth.uid());
end;
$$;

-- Kayıt adım 1 (sunucu): kod kullanılabilir mi. Hangi koşulun tutmadığı söylenmez.
create function public.davet_dogrula(p_kod text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.invite_codes
    where kod_hash = private.kod_hash(p_kod) and aktif and bitis > now() and kullanim < max_kullanim
  );
$$;

-- Kayıt adım 2 (sunucu, Supabase kullanıcısı oluşturulduktan sonra): kodu satır kilidiyle kullanır, profil ve karakteri açar.
-- Yetkililerin önceden eklediği, hesabı olmayan aynı nick'li karakter varsa hesaba bağlanır.
create function public.kayit_olustur(p_kod text, p_user_id uuid, p_nick text)
returns public.rutbe
language plpgsql volatile security definer set search_path = ''
as $$
declare
  kod public.invite_codes;
  karakter public.characters;
  karakter_var boolean;
  nick text := btrim(p_nick);
begin
  select * into kod from public.invite_codes
  where kod_hash = private.kod_hash(p_kod) and aktif and bitis > now() and kullanim < max_kullanim
  for update;
  if not found then
    raise exception 'Kod geçersiz ya da süresi dolmuş' using errcode = 'P0001';
  end if;

  select * into karakter from public.characters where lower(ad) = lower(nick) for update;
  karakter_var := found;
  if karakter_var and karakter.profile_id is not null then
    raise exception 'Bu nick kullanılıyor' using errcode = 'unique_violation';
  end if;

  insert into public.profiles (id) values (p_user_id);
  insert into public.hazirlik (profile_id) values (p_user_id);
  if karakter_var then
    update public.characters set profile_id = p_user_id, ana_karakter = true where id = karakter.id;
  else
    insert into public.characters (profile_id, ad, rutbe) values (p_user_id, nick, kod.rutbe);
  end if;

  update public.invite_codes set kullanim = kullanim + 1 where id = kod.id;
  insert into public.invite_redemptions (code_id, profile_id) values (kod.id, p_user_id);
  return coalesce(karakter.rutbe, kod.rutbe);
end;
$$;

-- Giriş (sunucu): nick'ten Supabase Auth'taki iç e-postayı bulur. Nick büyük/küçük harf duyarsız.
create function public.giris_eposta(p_nick text)
returns text
language sql stable security definer set search_path = ''
as $$
  select u.email
  from public.characters c join auth.users u on u.id = c.profile_id
  where lower(c.ad) = lower(btrim(p_nick))
  limit 1;
$$;

-- Yetkili, üyeye 24 saatlik tek kullanımlık sıfırlama kodu üretir. Yetkili yalnızca Üye'nin, yönetici herkesin kodunu üretir.
create function public.sifirlama_kodu_olustur(p_character_id uuid)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  hedef public.profiles;
  benim public.yetki := (select yetki from public.profiles where id = auth.uid());
  kod text := private.rastgele_kod(4) || '-' || private.rastgele_kod(4);
begin
  if benim is null or benim < 'yetkili' then
    raise exception 'Bu işlem için yetkili olmalısın' using errcode = 'insufficient_privilege';
  end if;
  select p.* into hedef from public.profiles p join public.characters c on c.profile_id = p.id where c.id = p_character_id;
  if not found then
    raise exception 'Bu karakterin hesabı yok' using errcode = 'P0001';
  end if;
  if benim <> 'yonetici' and hedef.yetki >= benim then
    raise exception 'Bu üyenin şifresini yalnızca yönetici sıfırlayabilir' using errcode = 'insufficient_privilege';
  end if;
  update public.password_resets set kullanildi_at = now() where profile_id = hedef.id and kullanildi_at is null;
  insert into public.password_resets (profile_id, kod_hash, bitis, olusturan)
  values (hedef.id, private.kod_hash(kod), now() + interval '24 hours', auth.uid());
  return kod;
end;
$$;

-- Şifre sıfırlama (sunucu): nick + kod doğruysa kodu kullanılmış yapar ve profil kimliğini döner.
create function public.sifirlama_kodu_kullan(p_nick text, p_kod text)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  sifirlama public.password_resets;
begin
  select r.* into sifirlama
  from public.password_resets r join public.characters c on c.profile_id = r.profile_id
  where lower(c.ad) = lower(btrim(p_nick)) and r.kod_hash = private.kod_hash(p_kod)
    and r.kullanildi_at is null and r.bitis > now()
  for update of r;
  if not found then
    raise exception 'Nick ya da kod hatalı' using errcode = 'P0001';
  end if;
  update public.password_resets set kullanildi_at = now() where id = sifirlama.id;
  return sifirlama.profile_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Üyenin kendi işlemleri
-- ---------------------------------------------------------------------------
-- Üye kendi ana karakterinin sınıf, level, reb ve ekipman görünürlüğünü değiştirir (null: değişmez).
create function public.profil_guncelle(
  p_sinif public.sinif default null,
  p_level int default null,
  p_reb int default null,
  p_ekipman_gorunur public.gorunurluk default null
)
returns public.characters
language plpgsql volatile security definer set search_path = ''
as $$
declare
  ayar public.clan_settings := (select s from public.clan_settings s);
  k public.characters;
  yeni_level int;
  yeni_reb int;
begin
  select * into k from public.characters where profile_id = auth.uid() and ana_karakter for update;
  if not found then
    raise exception 'Hesabına bağlı karakter yok' using errcode = 'P0001';
  end if;
  yeni_level := coalesce(p_level, k.level);
  yeni_reb := coalesce(p_reb, k.reb);
  if p_level is not null then
    if now() < ayar.acilis_at then
      raise exception 'Level sunucu açılınca girilir' using errcode = 'check_violation';
    end if;
    if p_level not between 1 and ayar.level_siniri then
      raise exception 'Level 1 ile % arası olmalı', ayar.level_siniri using errcode = 'check_violation';
    end if;
  end if;
  if yeni_level is distinct from 83 then
    yeni_reb := 0;
  elsif p_reb is not null and p_reb not between 0 and ayar.reb_siniri then
    raise exception 'Reb en fazla % olabilir', ayar.reb_siniri using errcode = 'check_violation';
  end if;
  update public.characters set
    sinif = coalesce(p_sinif, sinif),
    level = yeni_level,
    reb = yeni_reb,
    ekipman_gorunur = coalesce(p_ekipman_gorunur, ekipman_gorunur)
  where id = k.id
  returning * into k;
  return k;
end;
$$;

-- Yönetici yetki verir; son yönetici kendini düşüremez.
create function public.yetki_ver(p_profile_id uuid, p_yetki public.yetki)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.yetki_var('yonetici') then
    raise exception 'Bu işlem için yönetici olmalısın' using errcode = 'insufficient_privilege';
  end if;
  if p_yetki <> 'yonetici'
     and (select yetki from public.profiles where id = p_profile_id) = 'yonetici'
     and (select count(*) from public.profiles where yetki = 'yonetici') = 1 then
    raise exception 'Klanın en az bir yöneticisi olmalı' using errcode = 'check_violation';
  end if;
  update public.profiles set yetki = p_yetki where id = p_profile_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Satır düzeyinde güvenlik
-- ---------------------------------------------------------------------------
alter table public.clan_settings enable row level security;
alter table public.race_stats enable row level security;
alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.character_changes enable row level security;
alter table public.hazirlik enable row level security;
alter table public.milestones enable row level security;
alter table public.event_types enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.announcements enable row level security;
alter table public.invite_codes enable row level security;
alter table public.invite_redemptions enable row level security;
alter table public.password_resets enable row level security;
alter table public.game_rules enable row level security;
alter table public.class_trees enable row level security;
alter table public.item_sets enable row level security;
alter table public.item_set_bonuses enable row level security;
alter table public.items enable row level security;
alter table public.item_stats enable row level security;
alter table public.builds enable row level security;

-- Okuma: üye ve üstü (giriş ekranı klan adını ve armayı girişten önce okur)
create policy okuma on public.clan_settings for select to anon, authenticated using (true);
create policy okuma on public.race_stats for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.profiles for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.characters for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.character_changes for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.hazirlik for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.milestones for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.event_types for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.recurring_schedules for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.events for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.attendance for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.announcements for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.game_rules for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.class_trees for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.item_sets for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.item_set_bonuses for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.items for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.item_stats for select to authenticated using (public.yetki_var('uye'));
create policy okuma on public.invite_codes for select to authenticated using (public.yetki_var('yetkili'));
create policy okuma on public.invite_redemptions for select to authenticated using (public.yetki_var('yetkili'));
create policy okuma on public.password_resets for select to authenticated using (public.yetki_var('yetkili'));

-- Build: şablonlar herkese; kayıtlı build sahibine, ekipmanı "klan" olanlarınki tüm üyelere
create policy okuma on public.builds for select to authenticated using (
  public.yetki_var('uye') and (
    sablon
    or public.karakterim(character_id)
    or exists (select 1 from public.characters c where c.id = character_id and c.ekipman_gorunur = 'klan')
  )
);

-- Yazma: yetkili ve üstü
create policy yetkili_yazar on public.characters for all to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));
create policy yetkili_yazar on public.events for all to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));
create policy yetkili_yazar on public.attendance for all to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));
create policy yetkili_yazar on public.announcements for all to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));
create policy yetkili_yazar on public.recurring_schedules for all to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));
create policy yetkili_yazar on public.items for all to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));
create policy yetkili_yazar on public.item_stats for all to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));
create policy yetkili_yazar on public.item_sets for all to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));
create policy yetkili_iptal on public.invite_codes for update to authenticated
  using (public.yetki_var('yetkili')) with check (public.yetki_var('yetkili'));

-- Yazma: yönetici
create policy yonetici_yazar on public.clan_settings for update to authenticated
  using (public.yetki_var('yonetici')) with check (public.yetki_var('yonetici'));
create policy yonetici_yazar on public.milestones for all to authenticated
  using (public.yetki_var('yonetici')) with check (public.yetki_var('yonetici'));
create policy yonetici_yazar on public.event_types for all to authenticated
  using (public.yetki_var('yonetici')) with check (public.yetki_var('yonetici'));
create policy yonetici_yazar on public.game_rules for all to authenticated
  using (public.yetki_var('yonetici')) with check (public.yetki_var('yonetici'));
create policy yonetici_yazar on public.class_trees for all to authenticated
  using (public.yetki_var('yonetici')) with check (public.yetki_var('yonetici'));
create policy yonetici_yazar on public.race_stats for all to authenticated
  using (public.yetki_var('yonetici')) with check (public.yetki_var('yonetici'));
create policy yonetici_yazar on public.item_set_bonuses for all to authenticated
  using (public.yetki_var('yonetici')) with check (public.yetki_var('yonetici'));

-- Üyenin kendisi: TS nick'i, hazırlık listesi, kayıtlı build'i
create policy kendi_satiri on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy kendi_satiri on public.hazirlik for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy kendi_build on public.builds for all to authenticated
  using ((not sablon and public.karakterim(character_id)) or (sablon and public.yetki_var('yetkili')))
  with check ((not sablon and public.karakterim(character_id)) or (sablon and public.yetki_var('yetkili')));

-- Sütun izinleri: üye profilinde yalnızca TS nick'ini, yetkili davet kodunda yalnızca "aktif"i (iptal) değiştirir.
-- Yetki değişikliği yetki_ver(), karakter alanları profil_guncelle() ile.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (ts_nick) on public.profiles to authenticated;
revoke insert, update, delete on public.invite_codes, public.invite_redemptions, public.password_resets from anon, authenticated;
grant update (aktif) on public.invite_codes to authenticated;
revoke insert, update, delete on public.character_changes from anon, authenticated;

-- Fonksiyon izinleri: varsayılan herkese açık EXECUTE kaldırılır, yalnızca gereken rollere verilir.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.yetki_var(public.yetki), public.karakterim(uuid) to authenticated;
grant execute on function public.davet_olustur(public.rutbe, int, int, text),
  public.sifirlama_kodu_olustur(uuid),
  public.profil_guncelle(public.sinif, int, int, public.gorunurluk),
  public.yetki_ver(uuid, public.yetki)
  to authenticated;
grant execute on function public.davet_dogrula(text), public.kayit_olustur(text, uuid, text), public.giris_eposta(text),
  public.sifirlama_kodu_kullan(text, text), public.deneme_asildi(text, int, interval), public.deneme_kaydet(text),
  public.deneme_temizle(text)
  to service_role;
-- Tetikleyici fonksiyonları doğrudan çağrılmaz; RLS politikaları yetki_var/karakterim'i çağıran rolün yetkisiyle çalıştırır.

-- ---------------------------------------------------------------------------
-- 8. Başlangıç verisi
-- ---------------------------------------------------------------------------
insert into public.clan_settings (klan_adi, monogram, irk, ts_adres, acilis_at, level_siniri, reb_siniri)
values ('L4BEL', 'L4', 'karus', 'L4B', '2026-11-12 16:00+03', 80, 0);

-- Kaynak: NTTGame yeni sunucu sayfası (5 Ekim 2026). Tarihler kaynaklarda tutarsız; yönetici Ayarlar'dan düzeltir.
insert into public.milestones (sira, baslik, baslangic, bitis, saat_belli, aciklama, kaynak_url) values
  (1, '1. Ön kayıt', '2026-10-15 00:00+03', '2026-10-29 00:00+03', false, 'Ödüllü dönem. Telefon doğrulaması gerekli.', 'https://www.nttgame.com/knight/tr/newserveropen2026/'),
  (2, '2. Ön kayıt ve sunucu seçimi', '2026-10-29 00:00+03', '2026-11-10 00:00+03', false, 'Bitiş bazı kaynaklarda 12 Kasım.', 'https://www.nttgame.com/knight/tr/newserveropen2026/'),
  (3, 'Karakter oluşturma', '2026-11-10 00:00+03', '2026-11-12 16:00+03', false, 'Nick''ler ilk saatlerde alınmalı.', 'https://www.nttgame.com/knight/tr/newserveropen2026/'),
  (4, 'Sunucu açılışı', '2026-11-12 16:00+03', null, true, 'Lider L4BEL klanını ilk gün kurar. Savaş yalnızca Ronark Land (CZ)''de.', 'https://www.nttgame.com/knight/tr/newserveropen2026/');

insert into public.event_types (kod, ad, kisa_ad, yoklama_var) values
  ('csw', 'Castle Siege War', 'CSW', true),
  ('bdw', 'Border Defence War', 'BDW', true),
  ('juraid', 'Juraid Mountain', 'Juraid', true),
  ('chaos', 'Chaos', 'Chaos', true),
  ('ft', 'Forgotten Temple', 'FT', true),
  ('boss', 'Klan boss avı', 'Boss', true),
  ('toplanti', 'Klan toplantısı', 'Toplantı', true);

insert into public.race_stats (irk_turu, ad, taraf, siniflar, str, hp, dex, int, mp, dogrulandi) values
  ('arch_tuarek', 'Arch Tuarek', 'karus', '{warrior}', 65, 65, 60, 50, 50, true),
  ('tuarek', 'Tuarek', 'karus', '{rogue,priest}', 60, 60, 70, 50, 50, true),
  ('wrinkle_tuarek', 'Wrinkle Tuarek', 'karus', '{mage}', 50, 50, 70, 70, 50, true),
  ('puri_tuarek', 'Puri Tuarek', 'karus', '{mage,priest}', 50, 60, 60, 70, 50, true),
  ('kurian', 'Kurian', 'karus', '{kurian}', 65, 65, 60, 50, 50, true),
  ('barbarian', 'Barbarian', 'el_morad', '{warrior}', 65, 65, 60, 50, 50, true),
  ('el_morad_erkek', 'El Moradian (erkek)', 'el_morad', '{warrior,rogue,mage,priest}', 60, 60, 70, 50, 50, true),
  ('el_morad_kadin', 'El Moradian (kadın)', 'el_morad', '{warrior,rogue,mage,priest}', 50, 60, 60, 70, 50, true),
  ('porutu', 'Porutu', 'el_morad', '{kurian}', 65, 65, 60, 50, 50, true);

insert into public.class_trees (sinif, sira, ad) values
  ('warrior', 1, 'Attack'), ('warrior', 2, 'Defense'), ('warrior', 3, 'Passion'), ('warrior', 4, 'Master'),
  ('rogue', 1, 'Archery'), ('rogue', 2, 'Assassin'), ('rogue', 3, 'Explore'), ('rogue', 4, 'Master'),
  ('mage', 1, 'Flame'), ('mage', 2, 'Glacier'), ('mage', 3, 'Lightning'), ('mage', 4, 'Master'),
  ('priest', 1, 'Heal'), ('priest', 2, 'Buff'), ('priest', 3, 'Debuff'), ('priest', 4, 'Master'),
  ('kurian', 1, 'Attack'), ('kurian', 2, 'Defense'), ('kurian', 3, 'Devil'), ('kurian', 4, 'Master');

insert into public.game_rules (anahtar, deger, dogrulandi, kaynak) values
  ('olusturma_bonus_stat', '10', true, 'Oyun'),
  ('stat_per_level', '3', true, 'Oyun'),
  ('stat_per_level_60_ustu', '5', true, 'KO Bugda gelişmiş hesaplayıcı'),
  ('reb_bonus_stat', '2', true, 'Oyun'),
  ('stat_cap', '255', true, 'Oyun; reb dahil'),
  ('skill_start_level', '10', true, 'Sunucu kaynak kodu'),
  ('skill_per_level', '2', true, 'Sunucu kaynak kodu; reb skill puanı vermez'),
  ('agac_siniri', '{"genel": 80, "warrior_3": 83}', true, 'Sunucu kaynak kodu; ağaç en fazla level kadar'),
  ('master_level', '60', false, 'Sunucu kaynak kodu (KO Bugda level − 59)'),
  ('master_max', '23', false, 'Sunucu kaynak kodu');
