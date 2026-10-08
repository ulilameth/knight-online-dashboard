// supabase/seed.sql'i demo verisinden (lib/demo/fixtures.ts) üretir: yerel Supabase demo modla aynı klanı gösterir.
// Çalıştırma: npm run db:seed  (sonra: npx supabase db reset)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as f from "@/lib/demo/fixtures";

const CIKTI = fileURLToPath(new URL("../supabase/seed.sql", import.meta.url));

/** Demo kimlikleri ("p-karabey") veritabanında uuid: md5('p-karabey')::uuid */
const uid = (x: string | null) => (x ? `md5(${q(x)})::uuid` : "null");
function q(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") return `${q(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}
const satirlar = (rows: string[][]) => rows.map((r) => `  (${r.join(", ")})`).join(",\n");

const parcalar: string[] = [
  `-- Bu dosya scripts/seed-olustur.ts ile lib/demo/fixtures.ts'ten üretilir; elle değiştirme (npm run db:seed).
-- Yerel geliştirme için demo klanı: npx supabase start / npx supabase db reset. Gerçek projede ÇALIŞTIRMA.
-- Demo hesapları: KaraBey (yönetici), DemirYumruk (yetkili), GeceKuşu (üye) ... şifre ${f.DEMO_SIFRE}; davet kodu ${f.DEMO_DAVET_KODU}.
-- Kimlikler md5(demo kimliği)::uuid; iç e-posta <kimlik>@uye.l4bel.invalid.
`,
  `-- Supabase Auth hesapları (boş metin sütunları GoTrue için gerekli)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', id || '@uye.l4bel.invalid',
  extensions.crypt(${q(f.DEMO_SIFRE)}, extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}',
  now(), now(), '', '', '', ''
from (values
${satirlar(f.profiller.map((p) => [uid(p.id)]))}
) as h(id);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u where u.email like '%@uye.l4bel.invalid';
`,
  `insert into public.profiles (id, ts_nick, yetki) values
${satirlar(f.profiller.map((p) => [uid(p.id), q(p.tsNick), q(p.yetki)]))};
`,
  `insert into public.hazirlik (profile_id, otp, on_kayit, sunucu_secimi, karakter_adi, klana_katildi) values
${satirlar(f.hazirliklar.map((h) => [uid(h.profileId), q(h.otp), q(h.onKayit), q(h.sunucuSecimi), q(h.karakterAdi), q(h.klanaKatildi)]))};
`,
  `insert into public.characters (id, profile_id, ad, sinif, irk_turu, level, reb, rutbe, durum, ana_karakter, ekipman_gorunur, notlar, katilma_tarihi) values
${satirlar(f.karakterler.map((k) => [uid(k.id), uid(k.profileId), q(k.ad), q(k.sinif), q(k.irkTuru), q(k.level), q(k.reb), q(k.rutbe), q(k.durum), q(k.anaKarakter), q(k.ekipmanGorunur), q(k.notlar), q(k.katilmaTarihi)]))};
`,
  `insert into public.recurring_schedules (id, tur, baslik, gun, saat, sure_dk, aktif) values
${satirlar(f.haftalikDuzen.map((d) => [uid(d.id), q(d.tur), q(d.baslik), q(d.gun), q(d.saat), q(d.sureDk), q(d.aktif)]))};
`,
  `insert into public.events (id, tur, baslik, baslangic, bitis, aciklama, schedule_id, olusturan) values
${satirlar(f.etkinlikler.map((e) => [uid(e.id), q(e.tur), q(e.baslik), q(e.baslangic), q(e.bitis), q(e.aciklama), uid(e.scheduleId), uid(e.olusturan)]))};
`,
  `-- Yoklama: tüm etkinlikler için üretilir, yalnızca seed anında geçmiş olanlar eklenir
insert into public.attendance (event_id, character_id, durum, isaretleyen)
select v.event_id, v.character_id, v.durum::public.yoklama, v.isaretleyen
from (values
${satirlar(f.yoklamalar(new Date("2100-01-01")).map((y) => [uid(y.eventId), uid(y.characterId), q(y.durum), uid(y.isaretleyen)]))}
) as v(event_id, character_id, durum, isaretleyen)
join public.events e on e.id = v.event_id
where e.baslangic <= now();
`,
  `insert into public.announcements (id, baslik, govde, sabit, ts_gonderildi_at, yazar, created_at) values
${satirlar(f.duyurular.map((d) => [uid(d.id), q(d.baslik), q(d.govde), q(d.sabit), q(d.tsGonderildiAt), uid(d.yazar), q(d.createdAt)]))};
`,
  `insert into public.builds (id, character_id, ad, sinif, irk_turu, level, reb, statlar, skiller, ekipman, ap_girdileri, sablon, olusturan) values
${satirlar(f.buildler.map((b) => [uid(b.id), uid(b.characterId), q(b.ad), q(b.sinif), q(b.irkTuru), q(b.level), q(b.reb), q(b.statlar), `'{${b.skiller.join(",")}}'`, q(b.ekipman), q(b.apGirdileri), q(b.sablon), "null"]))};
`,
  `-- Demo davet kodu (500 kullanım)
insert into public.invite_codes (kod_hash, son_dort, rutbe, max_kullanim, bitis, aciklama, olusturan)
values (private.kod_hash(${q(f.DEMO_DAVET_KODU)}), ${q(f.DEMO_DAVET_KODU.slice(-4))}, 'uye', 500, '2099-01-01', 'Demo kodu', ${uid(f.profilId("KaraBey"))});
`,
];

writeFileSync(CIKTI, parcalar.join("\n"));
console.log(`supabase/seed.sql yazıldı: ${f.profiller.length} hesap, ${f.etkinlikler.length} etkinlik, ${f.duyurular.length} duyuru`);
