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

Takı ve cospre bonusları (eksik veri):
- Yüzük, küpe, kolye, kemer, kanat, dövme, amblem ve cospre parçalarının bonusları bu veride yok. kobugda.com'un yeni API'si
  bunları içeriyor ama sunucudan erişime kapalı. Tarayıcıda açılıp kaydedilen yanıtlar `api/<KATEGORI>.json` olarak bu klasöre
  konursa `scripts/katalog_olustur.py` onları kataloğa birleştirir (`legacyId` = buradaki `Identifier`). Örnek adres:
  `https://kobugda.com/api/items?category=RING&limit=200&includeSets=true`
  (kategoriler: RING, EARRING, NECKLACE, BELT, WINGS, TATTOO, EMBLEM, PATHOS, VALKYRIE_HELM, VALKYRIE_PAULDRON).
- Set bonusları (kobugda.com/sets): sayfa veriyi `https://kobugda.com/api/sets?limit=200` adresinden çekiyor; adres
  doğrudan isteğe kapalı (403). Tarayıcıda https://kobugda.com/sets açılıp F12 → Ağ (Network) → sayfa yenilenip
  `sets?limit=200` isteğinin yanıtı (Response) kopyalanır ve bu klasöre `api/setler.json` olarak kaydedilirse
  `scripts/katalog_olustur.py` setleri parça adlarından kataloğa bağlar. Setin kendi tablosu eski aile tablosunun
  (`set_bonuslari.json`) önüne geçer; Draki Legion gibi eski veride bonusu olmayan setler de bonus kazanır. Betik,
  tam set bonusu eski tablodan farklı çıkan setleri ve katalogda karşılığı olmayanları yazdırır.
- `Curse` alanı sayı değil, silahın olasılıklı etkisi ("Attack Hour 1% probability before Deadman's Call"); katalogda
  eşyanın `ef` alanına Türkçe olarak yazılır.
