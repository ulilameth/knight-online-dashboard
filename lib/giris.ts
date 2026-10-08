// Giriş, davet kodu, kayıt ve şifre sıfırlama mantığı (docs/PLAN.md §3).
// Supabase'e doğrudan bağlı değil: işlemler AuthArkaUc üzerinden yapılır, testte sahtesi verilir.
// Gerçek uygulama: lib/auth-arka-uc.ts (service role + oturum çerezi).

export const NICK_DESENI = /^\S{2,20}$/;
export const SIFRE_EN_AZ = 8;

export const HATA = {
  nick: "Nick 2-20 karakter olmalı ve boşluk içermemeli",
  sifreKisa: `Şifre en az ${SIFRE_EN_AZ} karakter olmalı`,
  sifreAyni: "Şifreler aynı değil",
  giris: "Nick ya da şifre hatalı",
  davet: "Kod geçersiz ya da süresi dolmuş",
  nickAlinmis: "Bu nick kullanılıyor",
  sifirlama: "Nick ya da kod hatalı",
  bekle: "Çok fazla deneme yaptın. 15 dakika sonra tekrar dene.",
  genel: "Bir şeyler ters gitti, tekrar dene",
} as const;

/** Veritabanı fonksiyonlarının kullanıcıya olduğu gibi gösterilebilecek hata mesajları */
const GOSTERILEBILIR = new Set<string>([HATA.davet, HATA.nickAlinmis, HATA.sifirlama]);

/** Supabase Auth'taki iç e-posta; kullanıcı hiç görmez (giriş nick'le yapılır) */
export const icEposta = (kullaniciId: string) => `${kullaniciId}@uye.l4bel.invalid`;

export type Sonuc<T = undefined> = { ok: true; deger: T } | { ok: false; hata: string };
const basarili = <T>(deger: T): Sonuc<T> => ({ ok: true, deger });
const hatali = (hata: string): Sonuc<never> => ({ ok: false, hata });

/** Service role ile çağrılan veritabanı fonksiyonları (supabase/migrations/0001_init.sql) */
export interface SunucuFonksiyonlari {
  deneme_asildi: { args: { p_anahtar: string }; donus: boolean };
  deneme_kaydet: { args: { p_anahtar: string }; donus: undefined };
  deneme_temizle: { args: { p_anahtar: string }; donus: undefined };
  giris_eposta: { args: { p_nick: string }; donus: string | null };
  davet_dogrula: { args: { p_kod: string }; donus: boolean };
  kayit_olustur: { args: { p_kod: string; p_user_id: string; p_nick: string }; donus: string };
  sifirlama_kodu_kullan: { args: { p_nick: string; p_kod: string }; donus: string };
}

export interface AuthArkaUc {
  /** Hata durumunda Error(message) fırlatır; message veritabanının mesajıdır */
  rpc<A extends keyof SunucuFonksiyonlari>(ad: A, args: SunucuFonksiyonlari[A]["args"]): Promise<SunucuFonksiyonlari[A]["donus"]>;
  kullaniciOlustur(id: string, eposta: string, sifre: string): Promise<void>;
  kullaniciSil(id: string): Promise<void>;
  /** Supabase'de kullanıcının açık oturumlarını da kapatır */
  sifreDegistir(id: string, sifre: string): Promise<void>;
  /** Şifre doğruysa kullanıcı kimliğini, değilse null döner; oturuma ve çerezlere dokunmaz */
  sifreDogrula(eposta: string, sifre: string): Promise<string | null>;
  /** Şifre doğruysa oturum çerezini yazar ve kullanıcı kimliğini, değilse null döner */
  oturumAc(eposta: string, sifre: string): Promise<string | null>;
  sonGirisYaz(id: string): Promise<void>;
}

const nickAnahtari = (nick: string) => nick.trim().toLocaleLowerCase("tr");
const mesaj = (e: unknown) => (e instanceof Error ? e.message : String(e));

function sifreHatasi(sifre: string, tekrar: string): string | null {
  if (sifre.length < SIFRE_EN_AZ) return HATA.sifreKisa;
  if (sifre !== tekrar) return HATA.sifreAyni;
  return null;
}

/** Deneme sınırına takıldıysa true; her yanlış denemede kaydet, başarıda temizle */
async function sinirda(a: AuthArkaUc, anahtar: string) {
  return a.rpc("deneme_asildi", { p_anahtar: anahtar });
}

export async function girisYap(a: AuthArkaUc, nick: string, sifre: string): Promise<Sonuc> {
  if (!NICK_DESENI.test(nick.trim()) || !sifre) return hatali(HATA.giris);
  const anahtar = `giris:${nickAnahtari(nick)}`;
  if (await sinirda(a, anahtar)) return hatali(HATA.bekle);
  const eposta = await a.rpc("giris_eposta", { p_nick: nick.trim() });
  const kullanici = eposta ? await a.oturumAc(eposta, sifre) : null;
  if (!kullanici) {
    await a.rpc("deneme_kaydet", { p_anahtar: anahtar });
    return hatali(HATA.giris);
  }
  await a.rpc("deneme_temizle", { p_anahtar: anahtar });
  await a.sonGirisYaz(kullanici);
  return basarili(undefined);
}

/** Kayıt adım 1: kod kullanılabilir mi. IP başına deneme sınırı; hangi koşulun tutmadığı söylenmez. */
export async function davetKoduKontrol(a: AuthArkaUc, kod: string, ip: string): Promise<Sonuc<string>> {
  const temiz = kod.replace(/\s/g, "").toUpperCase();
  const anahtar = `davet:${ip}`;
  if (await sinirda(a, anahtar)) return hatali(HATA.bekle);
  if (!temiz || !(await a.rpc("davet_dogrula", { p_kod: temiz }))) {
    await a.rpc("deneme_kaydet", { p_anahtar: anahtar });
    return hatali(HATA.davet);
  }
  return basarili(temiz);
}

export interface KayitGirdisi {
  kod: string;
  nick: string;
  sifre: string;
  sifreTekrar: string;
}

/**
 * Kayıt adım 2: Supabase kullanıcısı (iç e-posta + şifre) açılır, kayit_olustur() kodu satır kilidiyle kullanıp
 * profil ve karakteri oluşturur. Veritabanı adımı başarısız olursa açılan kullanıcı silinir.
 */
export async function kayitOlustur(a: AuthArkaUc, g: KayitGirdisi, yeniId: () => string = () => crypto.randomUUID()): Promise<Sonuc<{ rutbe: string }>> {
  const nick = g.nick.trim();
  if (!NICK_DESENI.test(nick)) return hatali(HATA.nick);
  const sh = sifreHatasi(g.sifre, g.sifreTekrar);
  if (sh) return hatali(sh);

  const id = yeniId();
  try {
    await a.kullaniciOlustur(id, icEposta(id), g.sifre);
  } catch {
    return hatali(HATA.genel);
  }
  let rutbe: string;
  try {
    rutbe = await a.rpc("kayit_olustur", { p_kod: g.kod, p_user_id: id, p_nick: nick });
  } catch (e) {
    await a.kullaniciSil(id);
    return hatali(GOSTERILEBILIR.has(mesaj(e)) ? mesaj(e) : HATA.genel);
  }
  await a.oturumAc(icEposta(id), g.sifre);
  await a.sonGirisYaz(id);
  return basarili({ rutbe });
}

export interface SifirlamaGirdisi {
  nick: string;
  kod: string;
  sifre: string;
  sifreTekrar: string;
}

/** Yetkilinin verdiği tek kullanımlık kodla yeni şifre. IP başına deneme sınırı. */
export async function sifreSifirla(a: AuthArkaUc, g: SifirlamaGirdisi, ip: string): Promise<Sonuc> {
  const sh = sifreHatasi(g.sifre, g.sifreTekrar);
  if (sh) return hatali(sh);
  const anahtar = `sifirla:${ip}`;
  if (await sinirda(a, anahtar)) return hatali(HATA.bekle);
  let profilId: string;
  try {
    profilId = await a.rpc("sifirlama_kodu_kullan", { p_nick: g.nick.trim(), p_kod: g.kod.replace(/\s/g, "") });
  } catch {
    await a.rpc("deneme_kaydet", { p_anahtar: anahtar });
    return hatali(HATA.sifirlama);
  }
  await a.sifreDegistir(profilId, g.sifre);
  await a.rpc("deneme_temizle", { p_anahtar: `giris:${nickAnahtari(g.nick)}` });
  return basarili(undefined);
}

export interface SifreDegisikligi {
  nick: string;
  eski: string;
  sifre: string;
  sifreTekrar: string;
}

/**
 * Profilim › Şifremi değiştir: mevcut şifre doğrulanır (nick başına deneme sınırı), sonra yenisi yazılır.
 * Şifre değişince Supabase bütün oturumları kapatır; bu cihazdaki oturum yeni şifreyle yeniden açılır.
 */
export async function sifreDegistir(a: AuthArkaUc, kullaniciId: string, g: SifreDegisikligi): Promise<Sonuc> {
  const sh = sifreHatasi(g.sifre, g.sifreTekrar);
  if (sh) return hatali(sh);
  if (g.eski === g.sifre) return hatali("Yeni şifre eskisiyle aynı olamaz");
  const anahtar = `sifre:${nickAnahtari(g.nick)}`;
  if (await sinirda(a, anahtar)) return hatali(HATA.bekle);
  const eposta = await a.rpc("giris_eposta", { p_nick: g.nick });
  const dogru = eposta ? await a.sifreDogrula(eposta, g.eski) : null;
  if (!eposta || dogru !== kullaniciId) {
    await a.rpc("deneme_kaydet", { p_anahtar: anahtar });
    return hatali("Mevcut şifre hatalı");
  }
  try {
    await a.sifreDegistir(kullaniciId, g.sifre);
  } catch {
    return hatali(HATA.genel);
  }
  await a.rpc("deneme_temizle", { p_anahtar: anahtar });
  await a.oturumAc(eposta, g.sifre);
  return basarili(undefined);
}
