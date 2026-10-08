import { expect, test } from "@playwright/test";
import { benzersiz, bildirim, girisYap } from "../yardimci";

test("takvim aylar arasında gezer, resmi tarihler görünür", async ({ page }) => {
  await girisYap(page, "GeceKuşu");
  await page.goto("/takvim");
  await expect(page.locator(".cal-nav h2")).toHaveText("Ekim 2026");
  await expect(page.locator(".month .ev.official").first()).toContainText("Ön kayıt");
  await page.getByRole("link", { name: "Sonraki ay" }).click();
  await expect(page.locator(".cal-nav h2")).toHaveText("Kasım 2026");
  await expect(page.locator(".month .ev.official", { hasText: "Sunucu açılışı" })).toContainText("16:00");
  await expect(page.locator("#ann-title")).toHaveCount(0);
});

test("yetkili duyuru yayınlar, sabitler, siler", async ({ page }) => {
  const baslik = benzersiz("Toplantı notu ");
  await girisYap(page, "AlevBüyü");
  await page.goto("/takvim");
  await page.locator("#ann-title").fill(baslik);
  await page.locator("#ann-body").fill("Pazar 21:00’de TS’te toplanıyoruz.");
  await page.locator("#ann-pin").check();
  await page.getByRole("button", { name: "Yayınla" }).click();
  await bildirim(page, "Duyuru yayınlandı");
  await expect(page.locator(".ann").first()).toContainText(baslik);
  await page.goto("/");
  await expect(page.getByText(baslik)).toBeVisible();
  await page.goto("/takvim");
  const kart = page.locator(".ann", { hasText: baslik });
  await kart.getByRole("button", { name: "Sil" }).click();
  await page.locator(".picker").getByRole("button", { name: "Sil" }).click();
  await bildirim(page, "Duyuru silindi");
  await expect(page.locator(".ann", { hasText: baslik })).toHaveCount(0);
});
