import { expect, test } from "@playwright/test";
import { bildirim, girisYap } from "../yardimci";

test("planlayıcı: stat sınırı, eşya ve set takma, kaydet, üye listesinde görünür", async ({ page }) => {
  await girisYap(page, "SessizOk");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/karakter");
  await expect(page.locator("#ap-val")).toHaveText("1578");
  await page.locator("#st-dex").fill("300");
  await page.locator("#st-dex").blur();
  await bildirim(page, "DEX en fazla 250 olabilir");
  await page.locator("#b-lv").fill("40");
  await page.locator("#b-lv").blur();
  await expect(page.getByText("Dağıtılan puan bu level için fazla")).toBeVisible();
  await expect(page.getByRole("button", { name: "Build’i kaydet" })).toBeDisabled();
  await page.getByRole("button", { name: "Kayıtlıya dön" }).click();
  await expect(page.locator("#b-lv")).toHaveValue("75");

  await page.locator('[data-pick="0"]').click();
  await page.locator("#pk-q").fill("iron bow");
  await page.locator(".pk-item").filter({ has: page.locator("b", { hasText: /^Exceptional Iron Bow$/ }) }).click();
  await bildirim(page, "Exceptional Iron Bow takıldı");
  await page.locator("#b-settak").click();
  await page.locator("#pk-q").fill("mythril");
  await page.locator(".pk-item").filter({ has: page.locator("b", { hasText: /^Mythril$/ }) }).click();
  await expect(page.locator(".set-line")).toContainText("Mythril · 5/5 parça");
  await page.locator("#ap-wolf").check();
  await expect(page.locator(".ap-tags")).toContainText("Wolf +%20");
  await page.getByRole("button", { name: "Build’i kaydet" }).click();
  await bildirim(page, "Build kaydedildi");
  await page.goto("/uyeler");
  await expect(page.locator('.eq-btn[aria-label^="SessizOk"]')).toContainText("Mythril 5/5");
});

test("eşyalar: detay bağlantısı, build'e tak, sınıfı uymayan eşya kapalı", async ({ page }) => {
  await girisYap(page, "SessizOk");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/esyalar?esya=263");
  await expect(page.locator(".picker h2")).toHaveText("Exceptional Iron Bow");
  await page.getByRole("button", { name: "Tak: Silah" }).click();
  await expect(page).toHaveURL("/karakter");
  await expect(page.locator('[data-pick="0"] b')).toHaveText("Exceptional Iron Bow");
  await page.goto("/esyalar");
  await page.locator(".cls-tab", { hasText: "Mage" }).click();
  await page.locator(".chip", { hasText: "Silah" }).click();
  await page.locator(".it-card").first().click();
  await expect(page.locator(".picker .id-actions button").first()).toBeDisabled();
  await expect(page.locator(".picker .crit-note")).toContainText("Build’inin sınıfı Rogue");
});

test("yetkili şablon yapar, üye kendi planına yükler", async ({ page, browser }) => {
  await girisYap(page, "KaraBey");
  await page.goto("/karakter");
  await page.getByRole("button", { name: "Şablon yap" }).click();
  await page.locator("#sablon-ad").fill("CSW warrior");
  await page.getByRole("button", { name: "Şablonu kaydet" }).click();
  await bildirim(page, "klan şablonlarına eklendi");
  const uye = await (await browser.newContext()).newPage();
  await girisYap(uye, "KılıçUstası");
  await uye.goto("/karakter");
  await expect(uye.getByRole("button", { name: "Şablon yap" })).toHaveCount(0);
  await uye.locator("li", { hasText: "CSW warrior" }).getByRole("button", { name: "Yükle" }).click();
  await expect(uye.locator(".toast")).toContainText("planına yüklendi");
  await expect(uye.locator("#b-cls")).toHaveValue("warrior");
});
