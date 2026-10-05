// Demo modunda Supabase Auth'un yerine: hesaplar ve kodlar bellekteki depoda, oturum bir çerezde.
import type { AuthArkaUc } from "@/lib/giris";
import { type DemoDepo, demoKodHash, yeniId } from "./depo";

/** oturumYaz: oturum açılınca profil kimliğini çereze yazar (Server Action'da) */
export function demoAuthArkaUc(d: DemoDepo, oturumYaz: (profilId: string) => Promise<void>): AuthArkaUc {
  const nickten = (nick: string) => d.karakterler.find((k) => k.profileId && k.ad.toLocaleLowerCase("tr") === nick.trim().toLocaleLowerCase("tr"));
  return {
    async rpc(ad, args) {
      const x = args as Record<string, string>;
      switch (ad) {
        case "deneme_asildi": {
          const son = Date.now() - 15 * 60_000;
          return ((d.denemeler.get(x.p_anahtar) ?? []).filter((t) => t > son).length >= 5) as never;
        }
        case "deneme_kaydet": d.denemeler.set(x.p_anahtar, [...(d.denemeler.get(x.p_anahtar) ?? []), Date.now()]); return undefined as never;
        case "deneme_temizle": d.denemeler.delete(x.p_anahtar); return undefined as never;
        case "giris_eposta": {
          const k = nickten(x.p_nick);
          return (k ? d.hesaplar.get(k.profileId!)?.eposta ?? null : null) as never;
        }
        case "davet_dogrula": {
          const kod = d.davetKodlari.find((c) => c.kodHash === demoKodHash(x.p_kod));
          return (!!kod && kod.aktif && Date.parse(kod.bitis) > Date.now() && kod.kullanim < kod.maxKullanim) as never;
        }
        case "kayit_olustur": {
          const kod = d.davetKodlari.find((c) => c.kodHash === demoKodHash(x.p_kod));
          if (!kod || !kod.aktif || Date.parse(kod.bitis) <= Date.now() || kod.kullanim >= kod.maxKullanim) throw new Error("Kod geçersiz ya da süresi dolmuş");
          const mevcut = d.karakterler.find((k) => k.ad.toLocaleLowerCase("tr") === x.p_nick.trim().toLocaleLowerCase("tr"));
          if (mevcut?.profileId) throw new Error("Bu nick kullanılıyor");
          const id = x.p_user_id;
          d.profiller.push({ id, tsNick: null, yetki: "uye", sonGiris: null });
          d.hazirliklar.push({ profileId: id, otp: false, onKayit: false, sunucuSecimi: false, karakterAdi: false, klanaKatildi: false });
          if (mevcut) Object.assign(mevcut, { profileId: id, anaKarakter: true });
          else {
            d.karakterler.push({
              id: yeniId(d, "c"), profileId: id, ad: x.p_nick.trim(), sinif: null, irkTuru: null, level: null, reb: 0,
              rutbe: kod.rutbe, durum: "aktif", anaKarakter: true, ekipmanGorunur: "klan", notlar: null,
              katilmaTarihi: new Date().toISOString().slice(0, 10), guncellendiAt: new Date().toISOString(),
            });
          }
          kod.kullanim += 1;
          d.davetKullanimlari.push({ codeId: kod.id, profileId: id, createdAt: new Date().toISOString() });
          return (mevcut?.rutbe ?? kod.rutbe) as never;
        }
        case "sifirlama_kodu_kullan": {
          const k = nickten(x.p_nick);
          const s = k && d.sifirlamalar.find((r) => r.profileId === k.profileId && r.kodHash === demoKodHash(x.p_kod) && !r.kullanildi && Date.parse(r.bitis) > Date.now());
          if (!s) throw new Error("Nick ya da kod hatalı");
          s.kullanildi = true;
          return s.profileId as never;
        }
      }
      throw new Error(`Demo'da yok: ${ad}`);
    },
    async kullaniciOlustur(id, eposta, sifre) { d.hesaplar.set(id, { eposta, sifre }); },
    async kullaniciSil(id) { d.hesaplar.delete(id); },
    async sifreDegistir(id, sifre) {
      const h = d.hesaplar.get(id);
      if (h) h.sifre = sifre;
    },
    async oturumAc(eposta, sifre) {
      const kayit = [...d.hesaplar].find(([, h]) => h.eposta === eposta && h.sifre === sifre);
      if (!kayit) return null;
      await oturumYaz(kayit[0]);
      return kayit[0];
    },
    async sonGirisYaz(id) {
      const p = d.profiller.find((x) => x.id === id);
      if (p) p.sonGiris = new Date().toISOString();
    },
  };
}
