// Her istekte: Supabase oturumunu yeniler (çerezler), oturum yoksa korumalı sayfalardan /giris'e yönlendirir.
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { DEMO_OTURUM_CEREZI } from "@/lib/demo/cerez";

const ACIK = ["/giris", "/kayit", "/sifre-sifirla"];

function girise(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/giris";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const yol = request.nextUrl.pathname;
  const acik = ACIK.some((p) => yol === p || yol.startsWith(`${p}/`));

  if (process.env.DATA_SOURCE !== "supabase") {
    return acik || request.cookies.has(DEMO_OTURUM_CEREZI) ? NextResponse.next() : girise(request);
  }

  let yanit = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (liste, basliklar) => {
        for (const { name, value } of liste) request.cookies.set(name, value);
        yanit = NextResponse.next({ request });
        for (const { name, value, options } of liste) yanit.cookies.set(name, value, options);
        for (const [ad, deger] of Object.entries(basliklar ?? {})) yanit.headers.set(ad, deger);
      },
    },
  });
  // getUser() oturumu sunucuda doğrular ve süresi dolan erişim anahtarını yeniler
  const { data } = await supabase.auth.getUser();
  if (!data.user && !acik) return girise(request);
  return yanit;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp|ico|json)$).*)"],
};
