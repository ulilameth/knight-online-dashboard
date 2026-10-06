// design/katalog.json'u (scripts/katalog_olustur.py çıktısı) veritabanı satırlarına çevirir.
// Tek dönüşüm iki yerde kullanılır: supabase/seed.sql'i üreten scripts/katalog-seed.mjs ve demo modunun kataloğu
// (lib/demo/katalog.ts). Böylece demo ile gerçek veritabanı aynı eşyaları, dereceleri ve setleri görür.

const SINIF = { war: "warrior", rog: "rogue", mag: "mage", pri: "priest", kur: "kurian" };
const TUM_SINIFLAR = Object.keys(SINIF).length;

/** Sıfır olmayan değerleri {alan: değer} nesnesine toplar */
function degerler(alanlar, satir) {
  const out = {};
  alanlar.forEach((alan, i) => { if (satir[i]) out[alan] = satir[i]; });
  return out;
}

/** @param {import("./satirlar.d.mts").Katalog} k */
export function katalogSatirlari(k) {
  const setAnahtarlari = new Set(k.setler.map((s) => s.k));
  const item_sets = k.setler.map((s) => ({ anahtar: s.k, ad: s.n, aile: s.a ?? null, parcalar: s.p, bonus_tablosu: null }));
  const items = k.esyalar.map((e) => ({
    id: e.id,
    ad: e.n,
    kategori: e.k,
    yuvalar: e.s,
    siniflar: e.c.length >= TUM_SINIFLAR ? [] : e.c.map((c) => SINIF[c]),
    derece: e.g,
    set_anahtari: e.set && setAnahtarlari.has(e.set) ? e.set : null,
    set_parcasi: e.sb ?? null,
    etki: e.ef ?? null,
    gorsel: e.i == null ? null : `${e.i}.png`,
    kaynak: "kobugda",
  }));
  // Derece satırı: [derece, ...k.alanlar[1..]]
  const statAlanlari = k.alanlar.slice(1);
  const item_stats = Object.entries(k.dereceler).flatMap(([id, satirlar]) =>
    satirlar.map(([arti, ...geri]) => ({ item_id: Number(id), arti, degerler: degerler(statAlanlari, geri) })));
  const item_set_bonuses = Object.entries(k.set_bonuslari).flatMap(([tablo, maskeler]) =>
    Object.entries(maskeler).map(([maske, satir]) => ({ tablo, maske: Number(maske), bonus: degerler(k.set_alanlari, satir) })));
  return { items, item_stats, item_sets, item_set_bonuses };
}
