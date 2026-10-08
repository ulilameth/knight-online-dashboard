// Yerel Supabase'in adres ve anahtarlarından .env.local yazar (npm run db:env).
// Önce: npm run db:baslat (Docker gerekir). Var olan .env.local'ın üzerine yazmak için: npm run db:env -- --zorla
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

const dosya = ".env.local";
if (existsSync(dosya) && !process.argv.includes("--zorla")) {
  console.error(`${dosya} zaten var. Üzerine yazmak için: npm run db:env -- --zorla`);
  process.exit(1);
}

let cikti;
try {
  cikti = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
} catch {
  console.error("Yerel Supabase çalışmıyor. Önce: npm run db:baslat (Docker açık olmalı)");
  process.exit(1);
}
const d = Object.fromEntries(cikti.split("\n").map((s) => s.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
for (const k of ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"]) {
  if (!d[k]) { console.error(`supabase status çıktısında ${k} yok`); process.exit(1); }
}

writeFileSync(dosya, `# npm run db:env ile yerel Supabase'ten üretildi
DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=${d.API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${d.ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${d.SERVICE_ROLE_KEY}
KAYIT_IMZA_ANAHTARI=${randomBytes(32).toString("base64")}
`);
console.log(`${dosya} yazıldı (DATA_SOURCE=supabase, ${d.API_URL}). Studio: ${d.STUDIO_URL ?? "http://127.0.0.1:54323"}`);
