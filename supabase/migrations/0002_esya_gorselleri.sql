-- Eşya görselleri: Ayarlar › Eşya kataloğu'ndan yüklenen simgeler (lib/katalog/gorsel.ts, lib/data/items.ts).
-- Kova herkese açık: görseller giriş yapmadan da adresiyle okunur (KO Bugda simgeleri gibi, gizli değil).
-- Yazma ve silme yalnızca yetkili; boyut ve tür sınırını Storage da uygular.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('esya-gorselleri', 'esya-gorselleri', true, 262144, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy esya_gorseli_yetkili_okur on storage.objects for select to authenticated
  using (bucket_id = 'esya-gorselleri' and public.yetki_var('yetkili'));
create policy esya_gorseli_yetkili_yukler on storage.objects for insert to authenticated
  with check (bucket_id = 'esya-gorselleri' and public.yetki_var('yetkili'));
create policy esya_gorseli_yetkili_siler on storage.objects for delete to authenticated
  using (bucket_id = 'esya-gorselleri' and public.yetki_var('yetkili'));
