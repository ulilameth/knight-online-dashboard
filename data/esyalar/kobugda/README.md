# KO Bugda eşya verisi

Kaynak: old.kobugda.com (Calculator). Çekme betiği: [`scripts/kobugda_scrape.py`](../../../scripts/kobugda_scrape.py)
(yeniden çalıştırınca `.cache/` üzerinden devam eder; `.cache/` repoya alınmaz).

| Dosya | İçerik |
|---|---|
| `kategoriler.json` | 29 eşya kategorisi |
| `esyalar.json` | 770 eşya (ad, kategori, slot, sınıf uygunluğu, set, `ItemImageId`) |
| `dereceler.json` | Eşya başına derece listesi (normal + reverse, +1…+10 / reverse +11…+31) |
| `istatistikler.json` / `.csv` | 9.156 eşya/derece çifti için istatistik (savunma, saldırı, gerekli statlar, bonuslar, dirençler…). CSV'de `ImageFile` sütunu görsele işaret eder |
| `gorseller/<ItemImageId>.png` | 488 benzersiz eşya görseli (45×45 PNG) |

Notlar:
- 770 eşyadan 334'ünün sunucuda derecesi/istatistiği yok (quest, cospre, takı vb.); bunlar yalnızca `esyalar.json` ve görselde bulunur.
- Bir görsel birden çok eşyada ortak olabilir (aynı `ItemImageId`).
