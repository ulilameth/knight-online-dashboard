import { expect, test } from "@playwright/test";
import { SIFRE, benzersiz, bildirim, girisYap } from "../yardimci";

test("davet kodu üretilir, kayıtta çalışır, iptal edilince çalışmaz", async ({ page, browser }) => {
  await girisYap(page, "KaraBey");
  await page.goto("/ayarlar");
  await page.locator("#d-rutbe").selectOption("uye");
  await page.getByRole("button", { name: "Kod oluştur" }).click();
  const kod = (await page.locator("#yeni-davet-kodu").textContent())!;
  expect(kod).toMatch(/^L4BEL-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);

  const yeni = await (await browser.newContext()).newPage();
  await yeni.goto("/kayit");
  await yeni.getByLabel("Davet kodu").fill(kod);
  await yeni.getByRole("button", { name: "Devam et" }).click();
  await expect(yeni).toHaveURL(/\/kayit\/hesap/);

  await page.locator("tr", { hasText: `…${kod.slice(-4)}` }).getByRole("button", { name: "İptal et" }).click();
  await bildirim(page, "Kod iptal edildi");
  await yeni.goto("/kayit");
  await yeni.getByLabel("Davet kodu").fill(kod);
  await yeni.getByRole("button", { name: "Devam et" }).click();
  await expect(yeni.getByText("Kod geçersiz ya da süresi dolmuş")).toBeVisible();
});

test("şifre sıfırlama kodu ile üye yeni şifre koyar", async ({ page, browser }) => {
  await girisYap(page, "KaraBey");
  await page.goto("/ayarlar");
  await page.locator("tr", { hasText: "Tufan" }).getByRole("button", { name: "Sıfırlama kodu" }).click();
  const kod = (await page.locator("#sifirlama-kodu").textContent())!;
  const yeniSifre = benzersiz("sifre-");
  const uye = await (await browser.newContext()).newPage();
  await uye.goto("/sifre-sifirla");
  await uye.getByLabel("Nick", { exact: true }).fill("Tufan");
  await uye.getByLabel("Sıfırlama kodu").fill(kod);
  await uye.getByLabel("Yeni şifre", { exact: true }).fill(yeniSifre);
  await uye.getByLabel("Yeni şifre tekrar").fill(yeniSifre);
  await uye.getByRole("button", { name: "Şifreyi değiştir" }).click();
  await girisYap(uye, "Tufan", yeniSifre);
  // Aynı kod ikinci kez kullanılamaz
  await uye.goto("/sifre-sifirla");
  await uye.getByLabel("Nick", { exact: true }).fill("Tufan");
  await uye.getByLabel("Sıfırlama kodu").fill(kod);
  await uye.getByLabel("Yeni şifre", { exact: true }).fill(SIFRE);
  await uye.getByLabel("Yeni şifre tekrar").fill(SIFRE);
  await uye.getByRole("button", { name: "Şifreyi değiştir" }).click();
  await expect(uye.getByText("Nick ya da kod hatalı")).toBeVisible();
});

test("yönetici yetki verir; yetkili klan bilgisini değiştiremez; üye Ayarlar'a giremez", async ({ page, browser }) => {
  await girisYap(page, "KaraBey");
  await page.goto("/ayarlar");
  await page.getByLabel("Sancaktar panel yetkisi").selectOption("yetkili");
  await bildirim(page, "Sancaktar: Yetkili");
  const s = await (await browser.newContext()).newPage();
  await girisYap(s, "Sancaktar");
  await s.goto("/ayarlar");
  await expect(s.getByLabel("Klan adı")).toBeDisabled();
  await expect(s.getByLabel("Bozkurt panel yetkisi")).toHaveCount(0);
  await page.getByLabel("Sancaktar panel yetkisi").selectOption("uye");
  await bildirim(page, "Sancaktar: Üye");
  await s.goto("/ayarlar");
  await expect(s).toHaveURL("/");
});
