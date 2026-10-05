// Oturumdaki kullanıcı ve yetki denetimi (sunucu bileşenleri ve Server Action'lar için).
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_OTURUM_CEREZI } from "@/lib/demo/cerez";
import { demoDepo } from "@/lib/demo/depo";
import { karakter, profil } from "@/lib/data/ortak";
import { veriKaynagi } from "@/lib/env";
import { supabaseSunucu } from "@/lib/supabase/server";
import { type Kullanici, type Yetki, yetkiYeterli } from "@/lib/types";

/** Oturum yoksa null. Demo modunda kullanıcı oturum çerezindeki profil kimliğidir. */
export async function getCurrentUser(): Promise<Kullanici | null> {
  if (veriKaynagi() === "demo") {
    const id = (await cookies()).get(DEMO_OTURUM_CEREZI)?.value;
    const d = demoDepo();
    const p = d.profiller.find((x) => x.id === id);
    if (!p) return null;
    const k = d.karakterler.find((x) => x.profileId === p.id && x.anaKarakter);
    return { profil: { ...p }, karakter: k ? { ...k } : null };
  }
  const db = await supabaseSunucu();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const [p, k] = await Promise.all([
    db.from("profiles").select("*").eq("id", data.user.id).maybeSingle(),
    db.from("characters").select("*").eq("profile_id", data.user.id).eq("ana_karakter", true).maybeSingle(),
  ]);
  if (!p.data) return null;
  return { profil: profil(p.data), karakter: k.data ? karakter(k.data) : null };
}

/** Sayfalar için: oturum yoksa girişe, yetki yetmezse ana sayfaya yönlendirir */
export async function requireYetki(enAz: Yetki = "uye"): Promise<Kullanici> {
  const k = await getCurrentUser();
  if (!k) redirect("/giris");
  if (!yetkiYeterli(k.profil.yetki, enAz)) redirect("/");
  return k;
}
