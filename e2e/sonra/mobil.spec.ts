import { expect, test } from "@playwright/test";
import { girisYap, hataTopla, tasmaYok } from "../yardimci";

test.use({ viewport: { width: 390, height: 844 } });

for (const [kim, sayfalar] of [
  ["KaraBey", ["/", "/uyeler", "/etkinlikler", "/takvim", "/karakter", "/esyalar", "/profil", "/ayarlar"]],
  ["GeceKuşu", ["/", "/uyeler", "/etkinlikler", "/takvim", "/profil"]],
] as const) {
  test(`telefonda sayfalar taşmıyor ve hata yok (${kim})`, async ({ page }) => {
    const hatalar = hataTopla(page);
    await girisYap(page, kim);
    for (const yol of sayfalar) {
      await page.goto(yol);
      await expect(page.locator("main h1")).toBeVisible();
      if (yol === "/karakter") await expect(page.locator("#ap-val")).toBeVisible();
      if (yol === "/esyalar") await expect(page.locator(".cls-tab").first()).toBeVisible();
      await tasmaYok(page);
    }
    expect(hatalar).toEqual([]);
  });
}
