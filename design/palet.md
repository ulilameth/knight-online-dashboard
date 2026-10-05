# L4BEL renk paleti

Karanlık fantastik bir MMORPG havası hedefleniyor: kömür ve dövme demir zeminler, parşömen tonlu yazı, ödül ve loot için eski altın. Marka rengi klanın ırkına göre değişir (Karus kırmızı-bordo, El Morad mavi-lacivert); geri kalan her şey iki ırkta da aynıdır.

- CSS değişkenleri: [`tokens.css`](tokens.css)
- Irk seçimi: kök elemanda `data-irk="karus"` veya `data-irk="el-morad"`

Kontrast oranları WCAG 2.1 formülüyle hesaplandı. Metin için eşik 4.5:1 (AA), ikon, nokta ve kontrol kenarı için 3:1.

## 1. Zeminler

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--bg-primary` | `#0f0e0d` | Kömür Karası | Sayfa zemini |
| `--bg-card` | `#191715` | Dövme Demir | Kart, panel, tablo zemini |
| `--bg-hover` | `#232019` | Örs Gölgesi | Hover, seçili satır, kart içi kutu, input zemini |

Saf siyah yerine hafif sıcak bir kömür kullanıldı; uzun süre bakınca parşömen tonlu yazıyla birlikte daha az yorar.

## 2. Marka (klan kimliği) ve vurgu

**Karus**

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--brand` | `#7a1b28` | Kan Bordosu | Birincil buton, arma zemini, üst bant |
| `--brand-hover` | `#94263a` | Şarap Bordosu | Birincil buton hover |
| `--brand-text` | `#e0707a` | Karus Kızılı | Koyu zeminde marka renkli metin ve ikon, aktif sekme çizgisi |
| `--brand-soft` | `rgba(122,27,40,.32)` | Bordo Sis | Marka renkli zemin vurgusu |

**El Morad**

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--brand` | `#1d3a74` | Kraliyet Laciverti | Birincil buton, arma zemini, üst bant |
| `--brand-hover` | `#274c93` | Gece Mavisi | Birincil buton hover |
| `--brand-text` | `#82a8ea` | El Morad Mavisi | Koyu zeminde marka renkli metin ve ikon, aktif sekme çizgisi |
| `--brand-soft` | `rgba(29,58,116,.38)` | Lacivert Sis | Marka renkli zemin vurgusu |

**Vurgu (iki ırkta aynı)**

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--accent` | `#c9a14a` | Eski Altın | Ödül ve loot, öne çıkan sayılar, ilerleme çubuğu, bağlantı, odak halkası |
| `--accent-hover` | `#e2bf6b` | Ganimet Altını | Altın öğelerin hover ve parlak hali |
| `--accent-bronze` | `#b07a40` | Bronz | İkincil vurgu: ikon, çizgi, 18px üstü metin |
| `--accent-soft` | `rgba(201,161,74,.14)` | Altın Tozu | "Resmi" etiketi, seçili liste öğesi zemini |
| `--text-on-accent` | `#1a1408` | Mürekkep Karası | Altın zemin üstündeki metin |

Rol ayrımı: marka rengi **kimlik** (bu klan, bu ırk), altın **değer** (ödül, ilerleme, önemli sayı). Bir ekranda birincil buton tektir ve marka renginde olur.

## 3. Metin

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--text-heading` | `#f1e8d4` | Parşömen Beyazı | Başlıklar, önemli değerler, buton metni |
| `--text-body` | `#d3c8b2` | Eski Parşömen | Gövde metni, tablo hücreleri |
| `--text-muted` | `#9c9282` | Solgun Mürekkep | İkincil bilgi, tarih, etiket, placeholder |

## 4. Sistem durumları

Düz yeşil/kırmızı yerine bitkisel, ateş ve büyü tonları. Her durum ikon ve etiketle birlikte kullanılır; zemin için `-soft` sürümü.

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--success` | `#6cba6e` | Şifa Otu | Kaydedildi, tamamlandı, yoklamada "Katıldı" |
| `--warning` | `#ee9a3c` | Meşale | Dikkat, süre doluyor, yoklamada "Geç" |
| `--error` | `#e5584f` | Ejder Kanı | Hata, başarısız işlem, yoklamada "Yok" |
| `--info` | `#56b6d0` | Mana Işığı | Bilgi notu, ipucu |

## 5. Oyuncu durumları

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--player-online` | `#4cc98a` | Yaşam Işığı | Çevrimiçi (dolu nokta) |
| `--player-offline` | `#726b62` | Kül | Çevrimdışı (boş halka); yazısı `--text-muted` |
| `--player-combat` | `#f0663f` | Savaş Alevi | Savaşta (çapraz kılıç ikonu) |
| `--player-afk` | `#a593ea` | Uyku Büyüsü | AFK (hilal ikonu) |

Not: Knight Online'ın resmi API'si olmadığı için bu bilgi otomatik gelmez. Kaynak, sonraki fazdaki Discord botu (Discord durumu) ya da üyenin kendi bildirimi olacak.

## 6. Rütbeler

Maden sırası: altın, gümüş, bronz, demir. Rütbe adı her zaman yazıyla da görünür.

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--rank-leader` | `#e7c46e` | Taç Altını | Klan lideri |
| `--rank-assistant` | `#c9ced6` | Gümüş Zırh | Yardımcı (asistan) |
| `--rank-officer` | `#cf9258` | Bronz Nişan | Subay |
| `--rank-member` | `#a69d8f` | Demir | Üye |
| `--rank-candidate` | `#958b7d` | Paslı Demir | Aday (ek) |

## 7. Grafik serisi

Sırayla kullanılır, karıştırılmaz. Bu sıra renk körlüğü testinden geçti (komşu çiftler arası en düşük ΔE 9.4, normal görüşte 17.9, hepsi kart zemininde 3:1 üstü). İlk beş renk aynı zamanda sınıf renkleridir. Grafik içindeki yazılar seri renginde değil, metin token'larında olur.

| Token | HEX | İsim | Sınıf |
|---|---|---|---|
| `--chart-1` | `#3f88dc` | Mana Mavisi | Warrior |
| `--chart-2` | `#d9622d` | Ateş Turuncusu | Rogue |
| `--chart-3` | `#1fa077` | Zümrüt | Mage |
| `--chart-4` | `#c48410` | Kehribar | Priest |
| `--chart-5` | `#d35a84` | Gül Kurusu | Kurian (Karus) / Porutu (El Morad) |
| `--chart-6` | `#8a7fe3` | Ametist | Altıncı seri ya da "diğer" |

## 8. Kenarlık ve ayırıcı

| Token | HEX | İsim | Kullanım |
|---|---|---|---|
| `--border-subtle` | `#2c2823` | Pas Çizgisi | Kart içi ayırıcı, tablo satır çizgisi, grafik ızgarası |
| `--border-default` | `#3a352e` | Zırh Kenarı | Kart ve panel kenarı |
| `--border-input` | `#766d60` | Örs Kenarı | Input, select, ikincil buton kenarı |
| `--border-focus` | `#c9a14a` | Eski Altın | Klavye odak halkası |

## Kontrast kontrolü

Her satırdaki üç değer sırasıyla Kömür Karası / Dövme Demir / Örs Gölgesi zemininde.

| Ön plan | Oran | Sonuç |
|---|---|---|
| Parşömen Beyazı | 15.83 / 14.67 / 13.34 | AA, AAA |
| Eski Parşömen | 11.64 / 10.79 / 9.81 | AA, AAA |
| Solgun Mürekkep | 6.29 / 5.83 / 5.30 | AA |
| Eski Altın | 7.97 / 7.39 / 6.72 | AA |
| Ganimet Altını | 10.93 / 10.13 / 9.21 | AA, AAA |
| Karus Kızılı | 6.22 / 5.76 / 5.24 | AA |
| El Morad Mavisi | 8.02 / 7.44 / 6.76 | AA |
| Şifa Otu | 8.16 / 7.56 / 6.88 | AA |
| Meşale | 8.56 / 7.94 / 7.22 | AA |
| Ejder Kanı | 5.36 / 4.97 / 4.52 | AA |
| Mana Işığı | 8.26 / 7.66 / 6.96 | AA |
| Taç Altını | 11.50 / 10.66 / 9.69 | AA, AAA |
| Gümüş Zırh | 12.20 / 11.31 / 10.28 | AA, AAA |
| Bronz Nişan | 7.26 / 6.73 / 6.12 | AA |
| Demir | 7.20 / 6.67 / 6.07 | AA |
| Paslı Demir | 5.76 / 5.33 / 4.85 | AA |
| Bronz | 5.24 / 4.86 / 4.41 | Büyük metin ve ikon (3:1) |

| Kombinasyon | Oran |
|---|---|
| Parşömen Beyazı / Kan Bordosu (Karus buton) | 8.55 |
| Parşömen Beyazı / Şarap Bordosu (hover) | 6.63 |
| Parşömen Beyazı / Kraliyet Laciverti (El Morad buton) | 9.02 |
| Parşömen Beyazı / Gece Mavisi (hover) | 6.78 |
| Mürekkep Karası / Eski Altın (altın buton) | 7.56 |
| Mürekkep Karası / Ganimet Altını | 10.37 |

İkon ve kenarlar (3:1, Dövme Demir / Örs Gölgesi): Yaşam Işığı 8.54 / 7.76, Kül 3.40 / 3.09, Savaş Alevi 5.68 / 5.17, Uyku Büyüsü 6.78 / 6.16, Örs Kenarı 3.51 / 3.19.

## Yazı tipleri (Google Fonts)

| Rol | Font | Ağırlık | Nerede |
|---|---|---|---|
| Başlık | **Cinzel** | 600, 700 | Klan adı (L4BEL), sayfa başlıkları, geri sayım rakamları. Roma yazıtı büyük harfleri; ciddi, taşa kazınmış his |
| Arayüz başlığı | **Barlow Condensed** | 500, 600, 700 | Kart başlıkları, etiketler, tablo başlıkları, istatistik sayıları, butonlar |
| Gövde | **Barlow** | 400, 500, 600 | Paragraflar, tablo hücreleri, form metinleri |

Üçü de Türkçe karakterleri (ı, İ, ğ, ş, ç, ö, ü) destekler. Cinzel'de küçük harfler küçük büyük harf (small caps) olarak çizilir; uzun metinde kullanılmaz.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&family=Cinzel:wght@600;700&display=swap">
```
