import { expect, test } from "@playwright/test";
import { benzersiz, bildirim, girisYap } from "../yardimci";

test("yetkili yoklamayı tek tıkla işaretler, tekrar basınca kaldırır; kalıcıdır", async ({ page }) => {
  await girisYap(page, "DemirYumruk");
  await page.goto("/etkinlikler");
  await expect(page.locator(".bars")).toBeVisible();
  await page.locator(".ev-item", { hasText: "Chaos" }).first().click();
  const satir = page.locator(".roster li", { hasText: "Bozkurt" });
  await satir.getByRole("button", { name: "Geç" }).click();
  await expect(satir.getByRole("button", { name: "Geç" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator(".roster li", { hasText: "Bozkurt" }).getByRole("button", { name: "Geç" })).toHaveAttribute("aria-pressed", "true");
  await page.locator(".roster li", { hasText: "Bozkurt" }).getByRole("button", { name: "Geç" }).click();
  await expect(page.locator(".summary")).toContainText("İşaretlenmedi");
  await page.getByRole("button", { name: "Boşları yok yap" }).click();
  await expect(page.locator(".summary")).not.toContainText("İşaretlenmedi");
});

test("etkinlik oluştur, düzenle, sil; yoklama saatinden önce açılmaz", async ({ page }) => {
  const baslik = benzersiz("Deneme BDW ");
  await girisYap(page, "DemirYumruk");
  await page.goto("/etkinlikler");
  await page.getByRole("button", { name: "Etkinlik oluştur" }).click();
  await page.locator("#e-tur").selectOption("bdw");
  await page.locator("#e-baslik").fill(baslik);
  await page.locator("#e-tarih").fill("2026-12-24");
  await page.locator("#e-saat").fill("21:30");
  await page.locator("#e-sure").selectOption("90");
  await page.locator(".picker form").getByRole("button", { name: "Oluştur" }).click();
  await bildirim(page, "Etkinlik oluşturuldu");
  await expect(page.locator(".detail h2")).toHaveText(baslik);
  await expect(page.locator(".detail .when2")).toContainText("24 Aralık Perşembe · 21:30–23:00 TSİ");
  await expect(page.locator(".detail .callout")).toContainText("Yoklama etkinlik saatinde açılır");
  await page.locator(".detail").getByRole("button", { name: "Düzenle" }).click();
  await page.locator("#e-saat").fill("22:00");
  await page.locator(".picker form").getByRole("button", { name: "Kaydet" }).click();
  await expect(page.locator(".detail .when2")).toContainText("22:00–23:30");
  await page.locator(".detail").getByRole("button", { name: "Sil" }).click();
  await page.locator(".picker").getByRole("button", { name: "Sil" }).click();
  await bildirim(page, "silindi");
  await expect(page.locator(".ev-item", { hasText: baslik })).toHaveCount(0);
});

test("üye yoklamayı görür, işaretleyemez", async ({ page }) => {
  await girisYap(page, "Yıldırım");
  await page.goto("/etkinlikler");
  await expect(page.getByRole("button", { name: "Etkinlik oluştur" })).toHaveCount(0);
  await expect(page.locator(".mark")).toHaveCount(0);
  await expect(page.locator(".roster .pill").first()).toBeVisible();
});
