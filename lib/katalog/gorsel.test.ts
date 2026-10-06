import { describe, expect, it } from "vitest";
import { MAX_GORSEL_BAYT, gorselDenetle, gorselTuru, gorselYolu, kovaYolu } from "./gorsel";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

describe("eşya görseli", () => {
  it("türü baytlardan anlar; SVG ve metin kabul edilmez", () => {
    expect(gorselTuru(PNG)).toBe("png");
    expect(gorselTuru(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(gorselTuru(WEBP)).toBe("webp");
    expect(gorselTuru(new TextEncoder().encode("GIF89a"))).toBe("gif");
    expect(gorselTuru(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(gorselTuru(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x41, 0x56, 0x49, 0x20]))).toBeNull();  // RIFF ama AVI
  });

  it("boş, büyük ve tanınmayan dosyayı reddeder", () => {
    expect(gorselDenetle(new Uint8Array())).toEqual({ hata: "Dosya boş" });
    const buyuk = new Uint8Array(MAX_GORSEL_BAYT + 1);
    buyuk.set(PNG);
    expect(gorselDenetle(buyuk)).toEqual({ hata: "Görsel en fazla 256 KB olabilir" });
    expect(gorselDenetle(Uint8Array.from([1, 2, 3]))).toEqual({ hata: "Görsel PNG, JPEG, WebP ya da GIF olmalı" });
    expect(gorselDenetle(PNG)).toEqual({ tur: "png" });
  });

  it("kovadaki yol eşya klasöründe, uzantı türe göre", () => {
    expect(gorselYolu(1_000_000, "jpeg", 36)).toBe("1000000/10.jpg");
  });

  it("yalnızca bu kovanın adresinden yol çıkarır", () => {
    const onek = "https://abc.supabase.co/storage/v1/object/public/esya-gorselleri/";
    expect(kovaYolu(`${onek}5/a%20b.png`, onek)).toBe("5/a b.png");
    expect(kovaYolu("353.png", onek)).toBeNull();
    expect(kovaYolu("https://baska.site/5.png", onek)).toBeNull();
    expect(kovaYolu(null, onek)).toBeNull();
  });
});
