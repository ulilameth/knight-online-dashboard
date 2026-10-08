import { type Page, expect } from "@playwright/test";

export const SIFRE = "demo1234";

export async function girisYap(page: Page, nick: string, sifre = SIFRE) {
  await page.goto("/giris");
  await page.getByLabel("Nick", { exact: true }).fill(nick);
  await page.getByLabel("Şifre", { exact: true }).fill(sifre);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL("/");
}

export async function cikisYap(page: Page) {
  await page.getByRole("button", { name: "Çıkış" }).click();
  await expect(page).toHaveURL("/giris");
}

/** Görünen bildirimin metni */
export async function bildirim(page: Page, metin: string | RegExp) {
  await expect(page.locator(".toast")).toContainText(metin);
}

/** Sayfa yatayda taşmıyor (telefon) */
export async function tasmaYok(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
}

/** Konsolda hata ya da sayfa hatası yok */
export function hataTopla(page: Page) {
  const hatalar: string[] = [];
  page.on("pageerror", (e) => hatalar.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") hatalar.push(m.text()); });
  return hatalar;
}

export const benzersiz = (onek: string) => `${onek}${Date.now().toString(36).slice(-4)}`;
