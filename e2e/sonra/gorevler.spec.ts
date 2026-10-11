import { type Page, expect, test } from "@playwright/test";
import { bildirim, girisYap } from "../yardimci";

const durak = (page: Page, id: string) => page.locator(`[data-durak="${id}"]`);
const gorev = (page: Page, id: string) => page.locator(`[data-gorev="${id}"]`);
const durakAc = (page: Page, id: string) => durak(page, id).locator(".durak-bas").click();

test("rota: durağım açık, durak açma, yaptım işareti kalıcı, arama, rehber sekmeleri", async ({ page }) => {
  await girisYap(page, "SessizOk");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/gorevler");
  await expect(page.locator("#gq-lv")).toHaveValue("75");
  await expect(durak(page, "75-80")).toHaveClass(/burada/);
  await expect(durak(page, "75-80").locator(".durak-bas")).toHaveAttribute("aria-expanded", "true");
  await expect(durak(page, "70-75")).toHaveClass(/gecti/);
  await expect(durak(page, "80-83")).toHaveClass(/kilitli/);
  await expect(page.locator(".durak.hedef")).toContainText("Hedef: 80");

  await durakAc(page, "80-83");
  await expect(durak(page, "80-83").locator(".durak-grup.sakla")).toContainText("83 açılınca");
  await expect(gorev(page, "nightmare")).toContainText("[Ascetic] Veda");

  // Level değişince rota o durağa geçer
  await page.locator("#gq-lv").fill("50");
  await page.locator("#gq-lv").press("Enter");
  await expect(durak(page, "50-60")).toHaveClass(/burada/);
  await expect(gorev(page, "crack-of-all-means")).toContainText("11,2 bar");
  await expect(durak(page, "50-60").locator(".durak-grup.atla")).toContainText("Protector of Guard Tower");
  await expect(gorev(page, "guard-tower")).toContainText("Yeni sunucuda yok");
  await gorev(page, "crack-of-all-means").locator(".rg-bas").click();
  await expect(gorev(page, "crack-of-all-means").locator(".rg-detay")).toContainText("Kaynak");
  await gorev(page, "crack-of-all-means").getByRole("checkbox").check();
  await expect(durak(page, "50-60").locator(".durak-sayac")).toHaveText("1/9");

  await page.reload();
  await page.getByRole("button", { name: "50–60 durağına git" }).click();
  await expect(gorev(page, "crack-of-all-means").getByRole("checkbox")).toBeChecked();
  await page.getByLabel("Yaptıklarımı gizle").check();
  await expect(gorev(page, "crack-of-all-means")).toHaveCount(0);

  // Klan Karus: El Morad NPC'si aranınca bulunmaz
  await page.locator("#gq-q").fill("tabeth");
  await expect(page.getByText("Bu aramayla görev yok.")).toBeVisible();
  await page.locator("#gq-q").fill("lemegeton");
  await expect(page.locator(".durak:not(.hedef)")).toHaveCount(1);
  await expect(gorev(page, "lemegeton")).toBeVisible();

  await page.getByRole("tab", { name: "Kaynaklar" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("EXP tablosu doğrulanmadı");
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
  await expect(durak(page, "80-83")).not.toHaveClass(/kilitli/);
  await expect(page.locator(".durak.hedef")).toContainText("Hedef: 83");
  await durakAc(page, "80-83");
  await expect(durak(page, "80-83").locator(".durak-grup.hemen")).toContainText("Fallen Spirit of Flame");
  await sinir("80");
});
