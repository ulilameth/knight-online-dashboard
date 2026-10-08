import { expect, test } from "@playwright/test";
import { bildirim, girisYap } from "../yardimci";

test("yönetici ırkı El Morad yapınca renkler ve Kurian adı değişir", async ({ page }) => {
  const irk = () => page.evaluate(() => document.documentElement.dataset.irk);
  const kaydet = async (deger: string) => {
    await page.goto("/ayarlar");
    await page.locator(`input[name=irk][value=${deger}]`).check();
    await page.locator("form", { has: page.getByLabel("Klan adı") }).getByRole("button", { name: "Kaydet" }).click();
    await bildirim(page, "Klan bilgisi kaydedildi");
  };
  await girisYap(page, "KaraBey");
  expect(await irk()).toBe("karus");
  await kaydet("el_morad");
  await page.goto("/uyeler");
  expect(await irk()).toBe("el-morad");
  await expect(page.locator(".brand")).toContainText("El Morad");
  await expect(page.locator("main")).toContainText("Porutu");
  await kaydet("karus");
  await page.goto("/");
  expect(await irk()).toBe("karus");
});
