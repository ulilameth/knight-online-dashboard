import { expect, test } from "@playwright/test";
import { girisYap } from "../yardimci";

test("açılıştan önce rota 1. levelden başlar", async ({ page }) => {
  await girisYap(page, "SessizOk");
  await page.getByRole("link", { name: "Görevler" }).click();
  await expect(page.locator("main h1")).toHaveText("Görevler");
  await expect(page.locator("#gq-lv")).toHaveValue("1");
  await expect(page.locator(".gr-kart")).toHaveAttribute("data-kart", "1-10");
  await expect(page.locator("[data-gorev=job-1]")).toContainText("Gerekli");
  await expect(page.locator(".gr-ust")).toContainText("10,79 milyar");
});
