import { expect, test } from "@playwright/test";
import { benzersiz, bildirim, cikisYap, girisYap } from "../yardimci";

test("yetkili üye ekler, aynı nick'i reddeder, rütbe değiştirir; değişiklik kaydı tutulur", async ({ page }) => {
  const nick = benzersiz("Yeniçeri");
  await girisYap(page, "DemirYumruk");
  await page.goto("/uyeler");
  await page.getByRole("button", { name: "Üye ekle" }).click();
  await page.locator("#f-ad").fill(nick);
  await page.locator("#f-sinif").selectOption("warrior");
  await page.locator(".picker form").getByRole("button", { name: "Kaydet" }).click();
  await bildirim(page, `${nick} eklendi`);
  await expect(page.locator("td.name", { hasText: nick })).toBeVisible();

  await page.getByRole("button", { name: "Üye ekle" }).click();
  await page.locator("#f-ad").fill("karabey");
  await page.locator(".picker form").getByRole("button", { name: "Kaydet" }).click();
  await expect(page.locator(".picker [role=alert]")).toHaveText("Bu nick kullanılıyor");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: `${nick} düzenle` }).click();
  await page.locator("#f-rutbe").selectOption("subay");
  await page.locator(".picker form").getByRole("button", { name: "Kaydet" }).click();
  await bildirim(page, `${nick} güncellendi`);
  await page.locator("td.name a", { hasText: nick }).click();
  await expect(page.getByRole("heading", { name: nick })).toBeVisible();
  await expect(page.locator("main")).toContainText("Rütbe: Aday → Subay");
});

test("üye listeyi görür ama düzenleyemez; profilini kaydeder, level açılıştan önce kapalı", async ({ page }) => {
  await girisYap(page, "Kartal");
  await page.goto("/uyeler");
  await expect(page.getByRole("button", { name: "Üye ekle" })).toHaveCount(0);
  await page.getByRole("button", { name: "Rogue" }).click();
  await expect(page.locator("tbody tr")).not.toHaveCount(0);
  await page.goto("/profil");
  await expect(page.locator("#pf-level")).toBeDisabled();
  await page.locator("#pf-ts").fill("kartal.ts");
  await page.locator(".pf-cls", { hasText: "Priest" }).click();
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await bildirim(page, "Profilin kaydedildi");
  await page.goto("/uyeler");
  await expect(page.locator("tr", { hasText: "Kartal" }).first()).toContainText("Priest");
  await cikisYap(page);
});
