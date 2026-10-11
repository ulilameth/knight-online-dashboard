import { type Page, expect, test } from "@playwright/test";
import { bildirim, girisYap } from "../yardimci";

const durak = (page: Page, id: string) => page.locator(`button[data-durak="${id}"]`);
const kart = (page: Page) => page.locator(".gr-kart");
const gorev = (page: Page, id: string) => page.locator(`[data-gorev="${id}"]`);

test("görevler: levelin durağı, durak seçme, gruplar, yaptım işareti kalıcı, arama, ipuçları", async ({ page }) => {
  await girisYap(page, "SessizOk");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/gorevler");
  await expect(page.locator("#gq-lv")).toHaveValue("75");
  await expect(kart(page)).toHaveAttribute("data-kart", "75-80");
  await expect(kart(page)).toContainText("Buradasın");
  await expect(durak(page, "70-75")).toContainText("Geçtin");
  await expect(durak(page, "80-83")).toContainText("83’te açılır");

  // Sınır 80 iken 80–83: ana liste yok, "83 açılınca" grubu açık gelir
  await durak(page, "80-83").click();
  await expect(kart(page).locator('[data-grup="sakla"]')).toContainText("Nightmare (1–2)");
  await expect(gorev(page, "nightmare")).toContainText("[Ascetic] Veda");

  // Level değişince kart o durağa geçer
  await page.locator("#gq-lv").fill("50");
  await page.locator("#gq-lv").press("Enter");
  await expect(kart(page)).toHaveAttribute("data-kart", "50-60");
  await expect(gorev(page, "crack-of-all-means")).toContainText("11,2 bar");
  await expect(gorev(page, "beth-hashan")).toContainText("+5 görev");
  await gorev(page, "crack-of-all-means").locator(".gr-gorev-ad").click();
  await expect(gorev(page, "crack-of-all-means").locator(".gr-detay")).toContainText("Kaynak");
  await kart(page).locator('[data-grup="atla"] > button').click();
  await expect(gorev(page, "guard-tower")).toContainText("Yeni sunucuda yok");
  await gorev(page, "crack-of-all-means").getByRole("checkbox").check();
  await expect(kart(page).locator(".gr-ilerleme")).toContainText("1 / 9 görev");

  await page.reload();
  await durak(page, "50-60").click();
  await expect(gorev(page, "crack-of-all-means").getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "Sonraki durak: 60–70 →" }).click();
  await expect(kart(page)).toHaveAttribute("data-kart", "60-70");

  // Klan Karus: El Morad NPC'si aranınca bulunmaz; sonuçtan durağa gidilir
  await page.locator("#gq-q").fill("tabeth");
  await expect(page.getByText("Bu aramayla görev yok")).toBeVisible();
  await page.locator("#gq-q").fill("lemegeton");
  await expect(page.getByText("1 görev bulundu")).toBeVisible();
  await page.locator(".gr-sonuc .btn").click();
  await expect(kart(page)).toHaveAttribute("data-kart", "70-75");
  await expect(gorev(page, "lemegeton").locator(".gr-detay")).toBeVisible();

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
  await expect(durak(page, "80-83")).not.toContainText("83’te açılır");
  await durak(page, "80-83").click();
  await expect(kart(page).locator(".gr-ana > .gr-liste")).toContainText("Fallen Spirit of Flame (1–2)");
  await sinir("80");
});
