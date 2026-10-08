// Giriş mantığının (lib/giris.ts) gerçek arka ucu: service role ile veritabanı fonksiyonları ve Supabase Auth admin,
// oturum açma ise kullanıcının çerezli istemcisiyle (Server Action içinde çağrılır).
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { demoAuthArkaUc } from "@/lib/demo/auth";
import { DEMO_OTURUM_CEREZI } from "@/lib/demo/cerez";
import { demoDepo } from "@/lib/demo/depo";
import { supabaseAdresi, supabaseAnonAnahtari, veriKaynagi } from "@/lib/env";
import type { AuthArkaUc } from "@/lib/giris";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseSunucu } from "@/lib/supabase/server";

export const OTURUM_SURESI_SN = 60 * 60 * 24 * 30;

export async function authArkaUc(): Promise<AuthArkaUc> {
  if (veriKaynagi() === "demo") {
    const cerezler = await cookies();
    return demoAuthArkaUc(demoDepo(), async (id) => {
      cerezler.set(DEMO_OTURUM_CEREZI, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: OTURUM_SURESI_SN, path: "/" });
    });
  }
  const admin = supabaseAdmin();
  const oturum = await supabaseSunucu();
  return {
    async rpc(ad, args) {
      const { data, error } = await admin.rpc(ad, args as never);
      if (error) throw new Error(error.message);
      return data as never;
    },
    async kullaniciOlustur(id, eposta, sifre) {
      const { error } = await admin.auth.admin.createUser({ id, email: eposta, password: sifre, email_confirm: true });
      if (error) throw new Error(error.message);
    },
    async kullaniciSil(id) {
      await admin.auth.admin.deleteUser(id);
    },
    async sifreDegistir(id, sifre) {
      const { error } = await admin.auth.admin.updateUserById(id, { password: sifre });
      if (error) throw new Error(error.message);
    },
    async sifreDogrula(eposta, sifre) {
      // Çerezsiz, saklanmayan geçici istemci: kullanıcının açık oturumu değişmez
      const gecici = createClient(supabaseAdresi(), supabaseAnonAnahtari(), { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await gecici.auth.signInWithPassword({ email: eposta, password: sifre });
      if (error) return null;
      await gecici.auth.signOut({ scope: "local" });
      return data.user.id;
    },
    async oturumAc(eposta, sifre) {
      const { data, error } = await oturum.auth.signInWithPassword({ email: eposta, password: sifre });
      return error ? null : data.user.id;
    },
    async sonGirisYaz(id) {
      await admin.from("profiles").update({ son_giris: new Date().toISOString() }).eq("id", id);
    },
  };
}

/** Oturumu kapatır */
export async function oturumuKapat() {
  if (veriKaynagi() === "demo") {
    (await cookies()).delete(DEMO_OTURUM_CEREZI);
    return;
  }
  await (await supabaseSunucu()).auth.signOut();
}
