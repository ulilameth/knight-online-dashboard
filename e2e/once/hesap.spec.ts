import { expect, test } from "@playwright/test";
import { SIFRE, benzersiz, cikisYap, girisYap } from "../yardimci";

test("yanlış şifre tek tip hata verir; doğru şifreyle giriş ve çıkış", async ({ page }) => {
  await page.goto("/uyeler");
  await expect(page).toHaveURL(/\/giris/);
  await page.getByLabel("Nick", { exact: true }).fill("KaraBey");
  await page.getByLabel("Şifre", { exact: true }).fill("yanlis-sifre");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByText("Nick ya da şifre hatalı")).toBeVisible();
  await girisYap(page, "KaraBey");
  await expect(page.getByRole("heading", { name: "Yeni sunucuya klanca hazırız" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Açılış takvimi" })).toBeVisible();
  await cikisYap(page);
});

test("davet koduyla kayıt: kod, hesap, karakter, hoş geldin", async ({ page }) => {
  const nick = benzersiz("Yeni");
  await page.goto("/kayit");
  await page.getByLabel("Davet kodu").fill("L4BEL-YANL-ISKD");
  await page.getByRole("button", { name: "Devam et" }).click();
  await expect(page.getByText("Kod geçersiz ya da süresi dolmuş")).toBeVisible();
  await page.getByLabel("Davet kodu").fill("L4BEL-DEMO-2026");
  await page.getByRole("button", { name: "Devam et" }).click();
  await expect(page).toHaveURL(/\/kayit\/hesap/);
  await page.getByLabel("Nick", { exact: true }).fill(nick);
  await page.getByLabel("Şifre", { exact: true }).fill(SIFRE);
  await page.getByLabel("Şifre tekrar").fill(SIFRE);
  await page.getByRole("button", { name: "Hesabı oluştur" }).click();
  await expect(page).toHaveURL(/\/kayit\/karakter/);
  await page.getByText("Mage", { exact: true }).click();
  await page.getByRole("button", { name: "Kaydet ve devam et" }).click();
  await expect(page).toHaveURL(/\/kayit\/hos-geldin/);
  await page.getByRole("link", { name: "Panele git" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/uyeler");
  await expect(page.locator("tbody tr", { hasText: nick })).toContainText("Mage");
});
