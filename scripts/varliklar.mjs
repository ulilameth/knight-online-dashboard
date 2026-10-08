// Uygulamanın sunduğu dosyaları hazırlar (npm run dev/build öncesi kendiliğinden çalışır):
//   design/katalog.json            → public/katalog.json   (Karakter tasarımı ve Eşyalar istemcide okur)
//   data/esyalar/kobugda/gorseller → public/esya/<görsel>.png
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const KOK = fileURLToPath(new URL("..", import.meta.url));
mkdirSync(`${KOK}public/esya`, { recursive: true });
copyFileSync(`${KOK}design/katalog.json`, `${KOK}public/katalog.json`);
const kaynak = `${KOK}data/esyalar/kobugda/gorseller`;
let n = 0;
for (const f of readdirSync(kaynak)) {
  if (!f.endsWith(".png")) continue;
  const hedef = `${KOK}public/esya/${f}`;
  if (!existsSync(hedef) || statSync(hedef).mtimeMs < statSync(`${kaynak}/${f}`).mtimeMs) { copyFileSync(`${kaynak}/${f}`, hedef); n++; }
}
console.log(`katalog.json ve ${n} yeni eşya görseli public/'e kopyalandı`);
