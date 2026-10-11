import { type Page, expect, test } from "@playwright/test";
import { bildirim, girisYap } from "../yardimci";

const gorev = (page: Page, id: string) => page.locator(`.gq[data-gorev="${id}"]`);
const aralikSec = (page: Page, ad: string) => page.getByRole("group", { name: "Level aralığı" }).getByRole("button", { name: ad, exact: true });

test("görevler: aralık karakterin levelinden, filtreler, yaptım işareti kalıcı", async ({ page }) => {
  await girisYap(page, "SessizOk");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/gorevler");
  await expect(page.locator("#gq-lv")).toHaveValue("75");
  await expect(aralikSec(page, "75–80")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".gq-sinir")).toContainText("Sınır şimdilik 80");

  await aralikSec(page, "80–83").click();
  await expect(gorev(page, "nightmare")).toContainText("83'e sakla");
  await expect(gorev(page, "nightmare")).toContainText("[Ascetic] Veda");

  await page.locator("#gq-lv").fill("50");
  await page.locator("#gq-lv").press("Enter");
  await expect(aralikSec(page, "50–60")).toHaveAttribute("aria-pressed", "true");
  await expect(gorev(page, "crack-of-all-means")).toContainText("11,2 bar");
  await gorev(page, "crack-of-all-means").getByRole("checkbox").check();
  await page.reload();
  await aralikSec(page, "50–60").click();
  await expect(gorev(page, "crack-of-all-means").getByRole("checkbox")).toBeChecked();
  await page.getByLabel("Yaptıklarımı gizle").check();
  await expect(gorev(page, "crack-of-all-means")).toHaveCount(0);

  await aralikSec(page, "Tümü").click();
  await page.getByRole("group", { name: "Öneri" }).getByRole("button", { name: "Atla" }).click();
  await expect(gorev(page, "guard-tower")).toContainText("Yeni sunucuda yok");
  await page.getByRole("group", { name: "Öneri" }).getByRole("button", { name: "Hepsi" }).click();
  // Klan Karus: El Morad NPC'si aranınca bulunmaz
  await page.locator("#gq-q").fill("tabeth");
  await expect(page.getByText("Bu filtreyle görev yok.")).toBeVisible();
});

test("level sınırı 83 olunca 80-82 görevleri hemen yapılır", async ({ page }) => {
  const sinir = async (deger: string) => {
    await page.goto("/ayarlar");
    await page.locator("#k-level").selectOption(deger);
    await page.locator("form", { has: page.getByLabel("Klan adı") }).getByRole("button", { name: "Kaydet" }).click();
    await bildirim(page, "Klan bilgisi kaydedildi");
  };
  await girisYap(page, "KaraBey");
  await sinir("83");
  await page.goto("/gorevler");
  await expect(page.locator(".gq-sinir")).toHaveCount(0);
  await aralikSec(page, "80–83").click();
  await expect(gorev(page, "fallen-spirit")).toContainText("Hemen yap");
  await sinir("80");
});
