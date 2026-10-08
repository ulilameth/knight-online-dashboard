// Uçtan uca testler (e2e/): demo modunda iki sunucu, saat sabit ki sonuç günden güne değişmesin.
//   once:  açılıştan önce (DEMO_SIMDI 2026-10-20 12:00 TSİ)
//   sonra: açılıştan sonra (DEMO_SIMDI 2026-11-21 19:40 TSİ)
// Önce derle: npm run build, sonra npm run e2e. Tarayıcı: npx playwright install chromium
// (önceden kurulu bir Chromium için PW_CHROMIUM=/yol/chromium).
import { defineConfig, devices } from "@playwright/test";

const sunucu = (port: number, simdi: string) => ({
  command: `npx next start -p ${port}`,
  url: `http://localhost:${port}/giris`,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  env: { DATA_SOURCE: "demo", DEMO_SIMDI: simdi, ...(process.env.NEXT_DIST_DIR && { NEXT_DIST_DIR: process.env.NEXT_DIST_DIR }) },
});

const tarayici = { ...devices["Desktop Chrome"], launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {} };

export default defineConfig({
  testDir: "e2e",
  // Demo verisi sunucunun belleğinde: testler sırayla çalışır, birbirinin verisine güvenmez
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { locale: "tr-TR", timezoneId: "Europe/Istanbul", trace: "retain-on-failure" },
  projects: [
    { name: "once", testMatch: /once\/.*\.spec\.ts/, use: { ...tarayici, baseURL: "http://localhost:3210" } },
    { name: "sonra", testMatch: /sonra\/.*\.spec\.ts/, use: { ...tarayici, baseURL: "http://localhost:3211" } },
  ],
  webServer: [sunucu(3210, "2026-10-20T12:00"), sunucu(3211, "2026-11-21T19:40")],
});
