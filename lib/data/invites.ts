// Davet kodları (yetkili üretir, listeler, iptal eder) ve şifre sıfırlama kodu üretme.
// Tam kod yalnızca üretildiği anda döner; listede son 4 karakter görünür.
import type { DavetKodu } from "@/lib/types";
import { demoKodHash, yeniId } from "@/lib/demo/depo";
import { type Db, type DemoBaglam, belki, VeriHatasi, davetKodu, demoYetki, simdiIso, sorgu } from "./ortak";

export interface KodGirdisi {
  rutbe: DavetKodu["rutbe"];
  /** Geçerlilik, gün (varsayılan 7) */
  gun?: number;
  /** Kaç kişi kullanabilir (varsayılan 25; tek kişilik kod için 1) */
  maxKullanim?: number;
  aciklama?: string | null;
}

export interface Katilim {
  codeId: string;
  profileId: string;
  createdAt: string;
}

export interface DavetVerisi {
  /** Yetkili */
  kodlar(): Promise<DavetKodu[]>;
  /** Yetkili: tam kodu döner (yalnızca bu an) */
  kodOlustur(g: KodGirdisi): Promise<string>;
  /** Yetkili */
  kodIptal(id: string): Promise<void>;
  /** Yetkili: kim hangi kodla katıldı */
  katilimlar(): Promise<Katilim[]>;
  /** Yetkili Üye'nin, yönetici herkesin: 24 saatlik tek kullanımlık sıfırlama kodu */
  sifirlamaKoduOlustur(characterId: string): Promise<string>;
}

const ALFABE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Demo için: veritabanındaki private.rastgele_kod() ile aynı alfabe */
export function rastgeleKod(uzunluk: number) {
  const baytlar = crypto.getRandomValues(new Uint8Array(uzunluk));
  return Array.from(baytlar, (x) => ALFABE[x % 32]).join("");
}

function dogrula(g: KodGirdisi) {
  if (g.rutbe !== "uye" && g.rutbe !== "aday") throw new VeriHatasi("Davet kodu yalnızca Üye ya da Aday rütbesi verir");
  const gun = g.gun ?? 7, max = g.maxKullanim ?? 25;
  if (!Number.isInteger(gun) || gun < 1 || gun > 90) throw new VeriHatasi("Geçerlilik 1 ile 90 gün arası olmalı");
  if (!Number.isInteger(max) || max < 1 || max > 500) throw new VeriHatasi("Kullanım sınırı 1 ile 500 arası olmalı");
  return { gun, max };
}

export function demoDavetler(b: DemoBaglam): DavetVerisi {
  const d = b.depo;
  return {
    async kodlar() {
      demoYetki(b, "yetkili");
      // Hash istemciye gitmez
      return d.davetKodlari
        .map((k): DavetKodu => ({ id: k.id, sonDort: k.sonDort, rutbe: k.rutbe, maxKullanim: k.maxKullanim, kullanim: k.kullanim, bitis: k.bitis, aktif: k.aktif, aciklama: k.aciklama, olusturan: k.olusturan, createdAt: k.createdAt }))
        .sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    },
    async kodOlustur(g) {
      const p = demoYetki(b, "yetkili");
      const { gun, max } = dogrula(g);
      const kod = `${d.ayarlar.klanAdi.toUpperCase().replace(/[^A-Z0-9]/g, "") || "KLAN"}-${rastgeleKod(4)}-${rastgeleKod(4)}`;
      d.davetKodlari.push({
        id: yeniId(d, "dk"), kodHash: demoKodHash(kod), sonDort: kod.slice(-4), rutbe: g.rutbe, maxKullanim: max, kullanim: 0,
        bitis: new Date(Date.now() + gun * 86_400_000).toISOString(), aktif: true, aciklama: g.aciklama ?? null, olusturan: p.id, createdAt: simdiIso(),
      });
      return kod;
    },
    async kodIptal(id) {
      demoYetki(b, "yetkili");
      const k = d.davetKodlari.find((x) => x.id === id);
      if (!k) throw new VeriHatasi("Kod bulunamadı");
      k.aktif = false;
    },
    async katilimlar() { demoYetki(b, "yetkili"); return structuredClone(d.davetKullanimlari); },
    async sifirlamaKoduOlustur(characterId) {
      const ben = demoYetki(b, "yetkili");
      const k = d.karakterler.find((x) => x.id === characterId);
      const hedef = k?.profileId ? d.profiller.find((p) => p.id === k.profileId) : undefined;
      if (!hedef) throw new VeriHatasi("Bu karakterin hesabı yok");
      if (ben.yetki !== "yonetici" && hedef.yetki !== "uye") throw new VeriHatasi("Bu üyenin şifresini yalnızca yönetici sıfırlayabilir");
      for (const s of d.sifirlamalar) if (s.profileId === hedef.id) s.kullanildi = true;
      const kod = `${rastgeleKod(4)}-${rastgeleKod(4)}`;
      d.sifirlamalar.push({ profileId: hedef.id, kodHash: demoKodHash(kod), bitis: new Date(Date.now() + 86_400_000).toISOString(), kullanildi: false });
      return kod;
    },
  };
}

export function supabaseDavetler(db: Db): DavetVerisi {
  return {
    async kodlar() { return (await sorgu(db.from("invite_codes").select("*").order("created_at", { ascending: false }))).map(davetKodu); },
    async kodOlustur(g) {
      const { gun, max } = dogrula(g);
      return sorgu(db.rpc("davet_olustur", { p_rutbe: g.rutbe, p_gun: gun, p_max: max, p_aciklama: g.aciklama ?? undefined }));
    },
    async kodIptal(id) {
      const r = await belki(db.from("invite_codes").update({ aktif: false }).eq("id", id).select("id").maybeSingle());
      if (!r) throw new VeriHatasi("Bu işlem için yetkin yok");
    },
    async katilimlar() {
      const r = await sorgu(db.from("invite_redemptions").select("*").order("created_at", { ascending: false }));
      return r.map((x) => ({ codeId: x.code_id, profileId: x.profile_id, createdAt: x.created_at }));
    },
    async sifirlamaKoduOlustur(characterId) {
      return sorgu(db.rpc("sifirlama_kodu_olustur", { p_character_id: characterId }));
    },
  };
}
