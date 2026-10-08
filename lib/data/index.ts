// Veri katmanının giriş noktası: istek başına DATA_SOURCE'a göre demo ya da Supabase uygulamasını kurar.
// Kullanım (sunucu bileşeni ya da Server Action): const v = await veri(); const uyeler = await v.uyeler.karakterler();
import "server-only";
import { cookies } from "next/headers";
import { DEMO_OTURUM_CEREZI } from "@/lib/demo/cerez";
import { demoDepo } from "@/lib/demo/depo";
import { veriKaynagi } from "@/lib/env";
import { supabaseSunucu } from "@/lib/supabase/server";
import { type DuyuruVerisi, demoDuyurular, supabaseDuyurular } from "./announcements";
import { type YoklamaVerisi, demoYoklamalar, supabaseYoklamalar } from "./attendance";
import { type BuildVerisi, demoBuildler, supabaseBuildler } from "./builds";
import { type EtkinlikVerisi, demoEtkinlikler, supabaseEtkinlikler } from "./events";
import { type DavetVerisi, demoDavetler, supabaseDavetler } from "./invites";
import { type UyeVerisi, demoUyeler, supabaseUyeler } from "./members";
import { type AsamaVerisi, demoAsamalar, supabaseAsamalar } from "./milestones";
import { type OyunVerisi, demoOyun, supabaseOyun } from "./oyun";
import { type HazirlikVerisi, demoHazirlik, supabaseHazirlik } from "./prep";
import { type AyarVerisi, demoAyarlar, supabaseAyarlar } from "./settings";

export interface Veri {
  uyeler: UyeVerisi;
  ayarlar: AyarVerisi;
  asamalar: AsamaVerisi;
  etkinlikler: EtkinlikVerisi;
  yoklamalar: YoklamaVerisi;
  duyurular: DuyuruVerisi;
  hazirlik: HazirlikVerisi;
  davetler: DavetVerisi;
  buildler: BuildVerisi;
  oyun: OyunVerisi;
}

export async function veri(): Promise<Veri> {
  if (veriKaynagi() === "demo") {
    const b = { depo: demoDepo(), kullaniciId: (await cookies()).get(DEMO_OTURUM_CEREZI)?.value ?? null };
    return {
      uyeler: demoUyeler(b), ayarlar: demoAyarlar(b), asamalar: demoAsamalar(b), etkinlikler: demoEtkinlikler(b),
      yoklamalar: demoYoklamalar(b), duyurular: demoDuyurular(b), hazirlik: demoHazirlik(b), davetler: demoDavetler(b),
      buildler: demoBuildler(b), oyun: demoOyun(b),
    };
  }
  const db = await supabaseSunucu();
  return {
    uyeler: supabaseUyeler(db), ayarlar: supabaseAyarlar(db), asamalar: supabaseAsamalar(db), etkinlikler: supabaseEtkinlikler(db),
    yoklamalar: supabaseYoklamalar(db), duyurular: supabaseDuyurular(db), hazirlik: supabaseHazirlik(db), davetler: supabaseDavetler(db),
    buildler: supabaseBuildler(db), oyun: supabaseOyun(db),
  };
}

export { VeriHatasi } from "./ortak";
