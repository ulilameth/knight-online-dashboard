// Karakter tasarımı: üyenin kayıtlı build'i (Üyeler › Ekipman) ve yetkili şablonları.
// Görünürlük: şablonlar herkese; kayıtlı build sahibine, ekipmanı "klan" olanlarınki tüm üyelere (Gizli: yalnızca sahibi).
import type { Build } from "@/lib/types";
import { yeniId } from "@/lib/demo/depo";
import { type Db, type DemoBaglam, belki, calistir, VeriHatasi, build, demoYetki, simdiIso, sorgu } from "./ortak";

export type BuildGirdisi = Omit<Build, "id" | "characterId" | "sablon" | "updatedAt">;

export interface BuildVerisi {
  /** Görebildiğin kayıtlı build'ler (Üyeler listesi için) */
  kayitliBuildler(): Promise<Build[]>;
  /** Kendi kayıtlı build'in */
  benimBuildim(): Promise<Build | null>;
  /** Kendi build'ini kaydeder (karakter başına tek) */
  buildKaydet(g: BuildGirdisi): Promise<Build>;
  sablonlar(): Promise<Build[]>;
  /** Yetkili; id verilirse günceller */
  sablonKaydet(g: BuildGirdisi & { id?: string }): Promise<Build>;
  /** Yetkili */
  sablonSil(id: string): Promise<void>;
}

function dogrula(g: BuildGirdisi) {
  if (!Number.isInteger(g.level) || g.level < 1 || g.level > 83) throw new VeriHatasi("Level 1 ile 83 arası olmalı");
  if (g.reb < 0 || g.reb > 10 || (g.reb && g.level !== 83)) throw new VeriHatasi("Reb yalnızca level 83'te, en fazla 10");
  if (g.skiller.length !== 4) throw new VeriHatasi("Skill dağılımı 3 ağaç ve master'dan oluşur");
}

export function demoBuildler(b: DemoBaglam): BuildVerisi {
  const d = b.depo;
  const karakterim = () => d.karakterler.find((k) => k.profileId === b.kullaniciId && k.anaKarakter);
  return {
    async kayitliBuildler() {
      demoYetki(b, "uye");
      return d.buildler.filter((x) => {
        if (x.sablon) return false;
        const k = d.karakterler.find((c) => c.id === x.characterId);
        return k && (k.ekipmanGorunur === "klan" || k.profileId === b.kullaniciId);
      }).map((x) => structuredClone(x));
    },
    async benimBuildim() {
      demoYetki(b, "uye");
      const k = karakterim();
      const x = k && d.buildler.find((y) => !y.sablon && y.characterId === k.id);
      return x ? structuredClone(x) : null;
    },
    async buildKaydet(g) {
      demoYetki(b, "uye");
      dogrula(g);
      const k = karakterim();
      if (!k) throw new VeriHatasi("Hesabına bağlı karakter yok");
      const mevcut = d.buildler.find((y) => !y.sablon && y.characterId === k.id);
      const yeni: Build = { ...structuredClone(g), id: mevcut?.id ?? yeniId(d, "b"), characterId: k.id, sablon: false, updatedAt: simdiIso() };
      if (mevcut) Object.assign(mevcut, yeni);
      else d.buildler.push(yeni);
      return structuredClone(yeni);
    },
    async sablonlar() { demoYetki(b, "uye"); return d.buildler.filter((x) => x.sablon).map((x) => structuredClone(x)); },
    async sablonKaydet(g) {
      demoYetki(b, "yetkili");
      dogrula(g);
      const mevcut = g.id ? d.buildler.find((y) => y.sablon && y.id === g.id) : undefined;
      if (g.id && !mevcut) throw new VeriHatasi("Şablon bulunamadı");
      const yeni: Build = { ...structuredClone(g), id: mevcut?.id ?? yeniId(d, "s"), characterId: null, sablon: true, updatedAt: simdiIso() };
      if (mevcut) Object.assign(mevcut, yeni);
      else d.buildler.push(yeni);
      return structuredClone(yeni);
    },
    async sablonSil(id) { demoYetki(b, "yetkili"); d.buildler = d.buildler.filter((x) => !(x.sablon && x.id === id)); },
  };
}

export function supabaseBuildler(db: Db): BuildVerisi {
  const satir = (g: BuildGirdisi) => ({
    ad: g.ad, sinif: g.sinif, irk_turu: g.irkTuru, level: g.level, reb: g.reb, statlar: g.statlar, skiller: g.skiller,
    ekipman: g.ekipman, ap_girdileri: g.apGirdileri as Record<string, never>,
  });
  async function karakterim(): Promise<{ id: string } | null> {
    const id = (await db.auth.getUser()).data.user?.id;
    if (!id) return null;
    return belki(db.from("characters").select("id").eq("profile_id", id).eq("ana_karakter", true).maybeSingle());
  }
  return {
    async kayitliBuildler() { return (await sorgu(db.from("builds").select("*").eq("sablon", false))).map(build); },
    async benimBuildim() {
      const k = await karakterim();
      if (!k) return null;
      const r = await belki(db.from("builds").select("*").eq("sablon", false).eq("character_id", k.id).maybeSingle());
      return r ? build(r) : null;
    },
    async buildKaydet(g) {
      dogrula(g);
      const k = await karakterim();
      if (!k) throw new VeriHatasi("Hesabına bağlı karakter yok");
      const mevcut = await belki(db.from("builds").select("id").eq("sablon", false).eq("character_id", k.id).maybeSingle());
      const r = mevcut
        ? await sorgu(db.from("builds").update(satir(g)).eq("id", mevcut.id).select().single())
        : await sorgu(db.from("builds").insert({ ...satir(g), character_id: k.id }).select().single());
      return build(r);
    },
    async sablonlar() { return (await sorgu(db.from("builds").select("*").eq("sablon", true).order("sinif"))).map(build); },
    async sablonKaydet(g) {
      dogrula(g);
      const r = g.id
        ? await belki(db.from("builds").update(satir(g)).eq("id", g.id).eq("sablon", true).select().maybeSingle())
        : await sorgu(db.from("builds").insert({ ...satir(g), sablon: true, olusturan: (await db.auth.getUser()).data.user?.id }).select().single());
      if (!r) throw new VeriHatasi("Bu işlem için yetkin yok");
      return build(r);
    },
    async sablonSil(id) { await calistir(db.from("builds").delete().eq("id", id).eq("sablon", true)); },
  };
}
