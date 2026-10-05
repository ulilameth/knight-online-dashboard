-- İlk yöneticiyi atama (kurulumda bir kez, Supabase › SQL Editor'da).
-- Panelde davet kodunu yetkililer üretir; ilk kodu üretecek kimse olmadığı için bu adım elle yapılır.

-- 1) Tek kullanımlık, 1 gün geçerli kurucu kodu üret ve çıkan kodu not al (ör. L4BEL-7KQM-2XWA).
select private.davet_kodu_uret('uye', 1, 1, 'Kurucu', null) as kurucu_kodu;

-- 2) Panelde /kayit sayfasından bu kodla kendi nick'inle kayıt ol.

-- 3) NICK yerine kendi nick'ini yazıp çalıştır: hesabın yönetici, karakterin Lider olur.
update public.profiles set yetki = 'yonetici'
where id = (select profile_id from public.characters where lower(ad) = lower('NICK'));
update public.characters set rutbe = 'lider' where lower(ad) = lower('NICK');

-- Sonraki yöneticileri panelde Ayarlar › Yetkiler'den verirsin.
