# L4BEL Klan Paneli: Plan

**L4BEL** klanı için Knight Online yeni sunucularına (12 Kasım 2026, 16:00 TSİ) yönelik, klan içi ve nick + şifreyle girilen web paneli. Klan iletişimi **TeamSpeak 3** üzerinden (sunucu adresi **L4B**); Discord kullanılmıyor.

- Tasarım prototipi: [`design/prototype.html`](../design/prototype.html) (tarayıcıda açılır, örnek verilerle çalışır). GitHub Pages yayını `.github/workflows/pages.yml`: yalnızca prototip, `katalog.json` ve eşya görselleri yayınlanır; Pages açık değilse iş atlanır
- Claude Design tuvali (ekranlar, kayıt, profil, renk paleti): https://claude.ai/artifact/DgqTbC48vWNhVAwpyawKkZ
- Renk paleti ve yazı tipleri: [`design/palet.md`](../design/palet.md), CSS değişkenleri: [`design/tokens.css`](../design/tokens.css)
- Bu doküman paralel çalışan cloud oturumlarının ortak referansıdır. Kapsam, dosya sahipliği ve kabul kriterleri burada.

---

## 1. Kapsam (v1)

| Özellik | Ne yapar | Kim kullanır |
|---|---|---|
| **Açılış geri sayımı** | Sunucu açılışına geri sayım, açılış aşamaları (ön kayıt, sunucu seçimi, karakter oluşturma), klanın hazırlık durumu | Herkes görür, tarihleri yöneticiler düzeltir |
| **Üye listesi ve roller** | Nick, sınıf, level (83+N dahil), rütbe, durum, TeamSpeak nick; filtre ve arama; sınıf dağılımı | Herkes görür, yetkililer düzenler |
| **Etkinlik katılım takibi** | Etkinlik oluşturma, etkinlik sırasında yoklama (Katıldı / Geç / Mazeretli / Yok), türlere ve üyelere göre katılım oranı | Yetkililer işaretler, üyeler kendi geçmişini görür |
| **Takvim ve duyurular** | Aylık takvim (telefonda ajanda), haftalık etkinlik düzeni, duyurular, sabitleme, TeamSpeak'e (L4B) mesaj olarak gönderim | Herkes görür, yetkililer yazar |
| **Davet koduyla kayıt** | Yeni üye, yetkililerin verdiği özel kodla kayıt olur: kod → nick ve şifre → karakter bilgisi | Kodu yetkililer üretir, üyeler kullanır |
| **Karakter tasarımı** | Build planlayıcı: sınıf, level (83+N dahil), stat ve skill puanı dağıtımı, katalogdan ekipman ve takı (ayrı cospre bölümü), klanla paylaşım, yetkili şablonları. AP, savunma, can, mana ve dirençler stat + eşya + takı bonuslarıyla otomatik hesaplanır | Her üye kendi build'ini, yetkililer şablonları |
| **Eşyalar** | Sınıfa göre eşya kataloğu: sınıf sekmeleri (Warrior, Rogue, Mage, Priest, Kurian), yuva grubu ve derece filtresi, arama; eşya detayında derece derece AP, savunma, gereken level ve statlar; tek tıkla build'e takma | Herkes görür, kataloğu yöneticiler düzenler |
| **Profilim** | Üye kendi sınıfını ve levelini günceller; değişiklik üye listesine hemen yansır | Her üye kendi profilini |

**v1 dışında (sonra):** loot/DKP, TeamSpeak'ten çevrimiçi listesi (WebQuery `clientlist -away`: oyuncu durumları çevrimiçi / AFK / savaşta buradan gelecek), üyelerin etkinliğe "katılacağım" bildirimi, oyun içinden otomatik veri çekme (KO'nun resmi API'si yok, tüm veri elle girilir).

### Panelin iki dönemi

Panel açılış tarihine göre görünüm değiştirir (prototipteki "Önizleme" anahtarı bunu gösteriyor):

- **Açılış öncesi:** Ana sayfada büyük geri sayım, açılış aşamaları ve hazırlık listesi (OTP, ön kayıt, sunucu seçimi, karakter adı). Üye tablosunda hazırlık sütunu. Yoklama yalnızca klan toplantıları için.
- **Açılış sonrası:** Ana sayfada sıradaki etkinliğe geri sayım, katılım özetleri. Üye tablosunda level. Hazırlık sütunu gizlenir.

---

## 2. Açılış takvimi (resmi bilgiler)

Kaynak: [NTTGame yeni sunucu sayfası](https://www.nttgame.com/knight/tr/newserveropen2026/) ve haber siteleri (5 Ekim 2026 itibarıyla).

| # | Aşama | Tarih | Not |
|---|---|---|---|
| 1 | 1. Ön kayıt | 15 – 29 Ekim | Ödüllü dönem. Telefon doğrulaması gerekli |
| 2 | 2. Ön kayıt ve sunucu seçimi | 29 Ekim – 9 Kasım | **Bazı kaynaklar bitişi 12 Kasım veriyor** |
| 3 | Karakter oluşturma | 10 – 11 Kasım | Bazı kaynaklar 10 – 12 Kasım diyor |
| 4 | Sunucu açılışı | **12 Kasım 2026 Perşembe, 16:00 TSİ** | `2026-11-12T13:00:00Z` |

Diğer bilgiler: Yeni sunuculara girişte **OTP zorunlu**. Yeni sunucularda **Ardream ve Ronark Land Base yok**, savaş yalnızca **Ronark Land (CZ)**'de. Sunucu isimleri henüz açıklanmadı. **Level sınırı açılışta 80**, sonra 83'e çıkar; ardından rebirth ile **83+1, 83+2 … 83+10**. Panelde güncel sınırı yönetici belirler.

Tarihler tutarsız olduğu için kodda sabit yazılmaz: `milestones` tablosunda tutulur, yöneticiler Ayarlar sayfasından düzeltir. Aşama saatleri duyurulmadığı için `saat_belli=false` olan aşamalarda yalnızca gün gösterilir.

### L4BEL'in açılış planı

Yeni sunucuda klan adları boş; **L4BEL** adını ilk kuran alır. Panel bu adımları hazırlık listesinde ve ana sayfada takip eder.

| Ne zaman | Ne yapılır | Kim |
|---|---|---|
| Şimdi – 15 Ekim | Herkes telefon doğrulaması ve OTP'yi açar, panelde işaretler | Tüm üyeler |
| 15 – 29 Ekim | Ödüllü 1. ön kayıt | Tüm üyeler |
| 29 Ekim – 9 Kasım | Sunucu oylaması; herkes aynı sunucuyu seçer | Yönetim oylar, üyeler seçer |
| 10 – 11 Kasım | Nick'ler alınır (lider ve asistanlar öncelikli) | Tüm üyeler |
| 12 Kasım 16:00 | Lider klan kurma şartlarını en hızlı şekilde tamamlayıp **L4BEL**'i kurar; tutmazsa yedek ad kullanılır | Lider, asistanlar destek |
| Açılış sonrası | Üyeler klana davet edilir, panelde "L4BEL'e katıldım" işaretlenir | Asistanlar davet eder |

Klan kurma şartları (level, para vb.) yeni sunucu için açıklanınca bu tabloya eklenecek.

---

## 3. Kullanıcılar ve yetkiler

Giriş **nick + şifre** ile yapılır (klan Discord kullanmıyor). İki ayrı kavram var:

- **Rütbe** (oyundaki unvan, görüntü amaçlı): Lider, Asistan, Subay, Üye, Aday. Karaktere bağlıdır.
- **Yetki** (panelde ne yapabildiği): hesaba bağlıdır.

| Yetki | Kim | Yapabilir |
|---|---|---|
| `yonetici` | Lider, asistanlar | Her şey + yetki verme, açılış tarihleri, klan ayarları |
| `yetkili` | Subaylar | Üye/karakter düzenleme, davet kodu üretme ve iptal, etkinlik oluşturma, yoklama, duyuru |
| `uye` | Davet koduyla kayıt olanlar | Her şeyi görme, kendi hazırlık listesini işaretleme, **kendi karakterinin sınıf ve levelini güncelleme** |

Davet kodu olmadan yeni hesap açılmaz; ayrı bir "onay bekleniyor" durumu yok.

### Giriş: nick + şifre

- Supabase Auth'un e-posta/şifre yöntemi kullanılır. Her üyeye kullanıcının hiç görmediği bir iç e-posta atanır (`<profil-id>@uye.l4bel`). Giriş formu nick'i bu adrese çevirip `signInWithPassword` çağırır; nick büyük/küçük harf duyarsız eşleşir.
- Şifre en az 8 karakter. Aynı nick için 15 dakikada 5 yanlış denemeden sonra bekleme.
- **Şifre sıfırlama:** e-posta olmadığı için yetkili, Ayarlar › Üyeler'den o üyeye tek kullanımlık **sıfırlama kodu** (24 saat geçerli) üretir; üye `/sifre-sifirla` sayfasında nick + kod + yeni şifre girer. Kod da davet kodu gibi hash'lenerek saklanır.
- Üye şifresini Profilim'den değiştirir (eski şifre + yeni şifre).

### Kayıt: davet kodu akışı

Yetkililer Ayarlar › Davet kodları'ndan kod üretir ve TeamSpeak'te (L4B) ya da özelden paylaşır. Kod biçimi `L4BEL-XXXX-XXXX` (karışabilecek 0/O, 1/I harfleri kullanılmaz).

| Adım | Ekran | Sunucu tarafında ne olur |
|---|---|---|
| 1 | **Davet kodu**: kodu yaz, "Devam et" | Kod doğrulanır (aktif mi, süresi dolmuş mu, kullanım sınırı dolmuş mu). Geçerliyse 15 dakikalık imzalı, `httpOnly` bir çerez yazılır. Hata mesajı tek tip: "Kod geçersiz ya da süresi dolmuş" (hangi koşulun tuttuğu söylenmez) |
| 2 | **Hesabını oluştur**: nick, şifre, şifre tekrar | Çerezdeki kod yeniden doğrulanır; nick benzersizliği kontrol edilir; `davet_kullan()` kullanım sayısını satır kilidiyle artırır; Supabase kullanıcısı (iç e-posta + şifre) ve kodun rütbesiyle (Üye ya da Aday) `uye` yetkili profil açılır; kullanım kaydı yazılır |
| 3 | **Karakterin**: sınıf, TeamSpeak nick (isteğe bağlı); level açılıştan sonra | `characters` satırı tamamlanır |
| 4 | **Hoş geldin**: TeamSpeak adresi (L4B), sıradaki hazırlık adımları, "Panele git" | |

Zaten üye olan biri `/giris`'ten nick ve şifresiyle girer. Giriş ekranında "Davet kodun var mı? Kayıt ol" bağlantısı var.

Güvenlik:
- Kodun kendisi saklanmaz; `sha256(kod + gizli tuz)` saklanır. Liste ekranında yalnızca son 4 karakter görünür, tam kod yalnızca üretildiği anda bir kez gösterilir.
- Deneme sınırı: aynı IP için 15 dakikada 5 yanlış deneme, sonra bekleme.
- Her kodun süresi (varsayılan 7 gün), kullanım sınırı (varsayılan 25) ve iptal düğmesi var. Tek kişilik kod için kullanım sınırı 1.
- Kim hangi kodla katıldı, `invite_redemptions` tablosunda tutulur; yetkililer Ayarlar'dan görür.

### Profilim

Üye `/profil` sayfasından (üst bardaki adına tıklayarak da) **nick**'ini görür (kilitli alan) ve şunları değiştirir:
- **TeamSpeak nick:** TS'te (L4B) görünen adı; yetkililer onu TS'te bununla tanır.
- **Sınıf:** açılıştan önce "planlanan sınıf", sonra oyundaki sınıf.
- **Level:** açılıştan önce kapalı. Açılıştan sonra 1 ile yöneticinin belirlediği sınır arası.
- **Reb:** yalnızca level 83 ve yönetici reb'i açmışsa; 1 ile reb sınırı arası. Panel her yerde **83+N** biçiminde gösterir (ör. 83+3); sıralamada 83+3, 83+2'nin önündedir.
- **Şifre:** eski + yeni şifreyle.

**Level sınırı (yönetici ayarı):** Ayarlar'da tek seçim kutusu: `80`, `83`, `83+1` … `83+10`. Açılışta 80. Seçim `clan_settings.level_siniri` (80 ya da 83) ve `reb_siniri` (0–10) olarak saklanır; üyeler bu sınırın üstünde değer kaydedemez (sunucuda da doğrulanır).

### Karakter tasarımı: kurallar ve veri

Formüller KO Bugda'nın gelişmiş hesaplayıcısındaki mantıkla kendi kodumuzla yazıldı (kaynak ekranda belirtilir); eşya verisi `data/esyalar/kobugda/`'dan gelir. Kurallar ve katsayılar `game_rules` tablosunda, yönetici Ayarlar'dan düzeltir; doğrulanmamış satırlar arayüzde "doğrulanacak" etiketiyle görünür.

| Kural | Değer | Durum |
|---|---|---|
| Karakter oluştururken bonus stat | 10 | Doğrulandı |
| Level başına stat puanı | 3, level 60'tan sonra 5 (level 83'te toplam 302) | Doğrulandı (sunucu kodu ve KO Bugda) |
| Reb başına bonus stat | +2 (dağıtım havuzuna eklenir) | Doğrulandı |
| Tek stat sınırı | 255, dağıtımda kesin sınır (reb puanları da geçemez); eşya bonusları üstüne eklenir | Klan liderinin kuralı; KO Bugda reb puanının 255'i geçebildiğini yazıyor |
| Skill puanı başlangıcı | Level 10 (1. meslek değişimi) | Doğrulandı |
| Level başına skill puanı | 2, 83'e kadar değişmez; reb skill puanı vermez | Doğrulandı (sunucu kodu, KO Bugda, oyuncu build'leri) |
| Ağaç başına en fazla | Level kadar ("The value of a Skill Point cannot be greater than your level"); ağaçların en üst skill'i 80, Warrior'ın 3. ağacı 83 | Doğrulandı (oyun istemcisi ve sunucu kodu) |
| Master skill | Level 60'ta açılır (2. meslek); level 60'tan sonra her level 1 puan, en fazla 23 | Level − 60 sunucu kodundan; KO Bugda level − 59 kullanıyor, doğrulanacak |
| Irk başlangıç statları | aşağıdaki tablo | Doğrulandı (Kurian = Porutu, KO Bugda'nın sınıf tablosuyla aynı) |
| Skill ağaçları | Warrior: Attack, Defense, Passion (Berserk) · Rogue: Archery, Assassin, Explore · Mage: Flame, Glacier, Lightning · Priest: Heal, Buff (Aura), Debuff (Spirit) · Kurian/Porutu: Attack, Defense, Devil | Doğrulandı |

Başlangıç statları ırka bağlıdır (her ırkta toplam 290). Dağıtılan puanlar bunların üstüne eklenir; ekranda "başlangıç + eklenen = toplam" gösterilir.

| Irk | Taraf | Sınıflar | STR | HP | DEX | INT | MP |
|---|---|---|---|---|---|---|---|
| Arch Tuarek | Karus | Warrior | 65 | 65 | 60 | 50 | 50 |
| Tuarek | Karus | Rogue, Priest | 60 | 60 | 70 | 50 | 50 |
| Wrinkle Tuarek | Karus | Mage | 50 | 50 | 70 | 70 | 50 |
| Puri Tuarek | Karus | Mage, Priest | 50 | 60 | 60 | 70 | 50 |
| Kurian | Karus | Kurian | 65 | 65 | 60 | 50 | 50 |
| Barbarian | El Morad | Warrior | 65 | 65 | 60 | 50 | 50 |
| El Moradian (erkek) | El Morad | Warrior, Rogue, Mage, Priest | 60 | 60 | 70 | 50 | 50 |
| El Moradian (kadın) | El Morad | Warrior, Rogue, Mage, Priest | 50 | 60 | 60 | 70 | 50 |
| Porutu | El Morad | Porutu | 65 | 65 | 60 | 50 | 50 |

Hesap: dağıtılabilir stat = 10 + 3 × (level − 1) + 2 × (level − 60, level 60'ın üstündeyse) + 2 × reb; karakter statı = ırk başlangıcı + dağıtılan, en fazla 255; toplam stat = karakter statı + takılı eşyaların stat bonusları (ekranda "70+30+12" gibi ayrı gösterilir); dağıtılabilir skill = level ≥ 10 ise 2 × (level − 9). Her ağaç en fazla level kadar (80'i geçen puan boşa gider, Warrior 3. ağaç 83), master en fazla min(23, level − 60). Level düşürülünce sınırı aşan ağaç kırmızı görünür ve kaydetme kapanır. Stat ve skill değerleri kutuya yazılarak da girilir (stat kutusuna karakter statı yazılır, ör. DEX 255); +/− düğmeleri ve ok tuşları (Shift ile 10'ar) da çalışır. Yazılan değer kutudan çıkınca başlangıç statı, 255, ağaç sınırı ve kalan puana göre düzeltilir ve neden düzeltildiği bildirilir.

**Saldırı, savunma ve can (otomatik).** Formüller ve katsayılar KO Bugda gelişmiş hesaplayıcısından (sitenin kendi koduna bakılarak) alındı, kendi kodumuzla yazıldı; oyun içi değerle doğrulanacak. Yeni AP fonksiyonu, daha önce temel hesaplayıcıyla doğrulanan sürümle 50.000 rastgele girdide aynı sonucu veriyor. Elle girilen alan yok; yalnızca buff seçimleri (WES, Wolf) ve "ek stat / ek AP %" (scroll, buff) var.
- **Eşya toplamı:** takılı her eşyanın seçili derecesindeki satır toplanır: stat bonusları (STR, HP, DEX, INT, MP), can ve mana puanı, savunma ve savunma bonusu, hasar %, savunma %, element hasarı (ateş, buz, şimşek, zehir), dirençler, HP/MP yenileme, kaçınma, fiziksel yansıtma, silah türlerine karşı savunma. Silahın olasılıklı etkisi ("Saldırırken %1 ihtimalle: Deadman's Call") ayrıca listelenir. Bonus verisi olmayan takılı eşya uyarıyla gösterilir.
- **Hesap tipi sınıftan ve silahtan çıkar:** Warrior (sağ + sol el silah), Rogue (yay ya da arbalet takılıysa Archer, değilse Assassin: hançer + sol el), Priest (topuz → club katsayısı, diğerleri sword; "Priest Weapon / Mace" takılıysa INT Battle Priest), Mage (asa), Kurian (kılıç). Sol eldeki kalkan AP'ye girmez.
- **AP:** silah AP (+ sol el silahın yarısı; WES +5, Assassin'de sol ele +3, sonuca +1), toplam ana stat (karakter + eşya + ek), base AP (Rogue dışı: karakter STR/INT'i 150'nin üstündeyse stat − 150, tam 160'ta bir eksik), silah dışı eşyalardan gelen AP (takı, zırh) base AP'ye eklenir; AP % = eşyaların hasar %'si + Wolf + ek. Katsayı kademesi: level 1–9, 10–59, 60–83.
- **Savunma:** level + (Kurian dışı, karakter HP statı 100'ün üstündeyse fazlası) + eşya savunmaları + savunma bonusu; Kurian'da × 0,8; kanadın savunma %'si en sonda çarpılır.
- **Can ve mana:** sınıf katsayısıyla level² × HP statı formülü + eşyaların can bonusu (en fazla 14.000); Mage/Priest manası INT + 30 üzerinden. Katsayılar `game_rules`'ta.
- **Direnç:** toplam INT 100'ün üstündeyse (INT − 100) / 2, her dirence; üstüne eşya direnci.

**Eşya kataloğu ve seçici.** Ekipman yuvaları serbest metin değil, katalogdan seçilir: yuvaya tıklanınca yalnızca build'in sınıfının kullanabildiği eşyaları gösteren, aramalı ve "levelime uygun" filtreli bir liste açılır; derece renkle ve yazıyla gösterilir; sınıfa ya da levela uymayan takılı eşya uyarı verir. Katalog `items` tablosundadır ve yöneticiler Ayarlar › Eşya kataloğu'ndan doldurur:
- Tek tek ekleme/düzenleme.
- **Mevcut veri:** [`data/esyalar/kobugda/`](../data/esyalar/kobugda/README.md): 29 kategori, 770 eşya, 488 görsel, 436 eşya için 21 dereceye kadar istatistik (AP, savunma, gereken level ve statlar, bonuslar). **Eksik:** takıların (yüzük, küpe, kolye, kemer) ve cospre/kanat/dövme/amblemin bonusları eski KO Bugda'da yok; bunlar takılabiliyor ama hesaba girmiyor.
- **Takı ve cospre bonusları için API içe aktarma:** kobugda.com'un yeni API'si (`/api/items?category=RING&limit=200&includeSets=true` gibi) bu verileri içeriyor, ancak sunucudan erişime kapalı ("Access denied"). Tarayıcıda açılıp kaydedilen yanıtlar `data/esyalar/kobugda/api/*.json` altına konursa `katalog_olustur.py` bunları birleştirir: `legacyId` eski eşya kimliğiyle eşleşir, derecesi olmayan eşyalar tamamlanır, hiç olmayan eşyalar (görselsiz) eklenir. Kategoriler: RING, EARRING, NECKLACE, BELT, WINGS, TATTOO, EMBLEM, PATHOS, VALKYRIE_HELM, VALKYRIE_PAULDRON. Set bonusları için `/api/sets?limit=200` yanıtı (kobugda.com/sets sayfasının çektiği) da kaydedilirse setlere bağlanır (aşağıda Set bonusu). Çekme betiği `scripts/kobugda_scrape.py`. Prototipin okuduğu küçük katalog `design/katalog.json`, `scripts/katalog_olustur.py` ile üretilir; Faz 0'da aynı dönüşüm `items`, `item_stats`, `item_sets` seed'ine çevrilir.
- **Yuva eşlemesi (KO Bugda yuva tipi → panel):** Weapon / Shield → Silah (sağ el ya da normal) ve İkinci el (sol el, kategoriye göre); yay oyunda sol elde durur ama tek silahtır, planlayıcıda Silah yuvasına takılır (`YUVA_DUZELTME`); Helmet → Kask; Pauldron → Zırh; Pads → Pantolon; Gauntlets → Eldiven; Boots → Bot; Necklace → Kolye; Earring → Küpe; Ring → Yüzük; Belt → Kemer; ValkirieHelmet → Cospre başlık; ValkiriePauldron → Cospre zırh; PathosGlove → Cospre eldiven; Wings → Kanat; Tattoo → Dövme; Emblem → Amblem.
- **Derece:** Verideki dereceler +1…+21 (reverse). Yuvada derece seçilir; AP, savunma ve gereken statlar o dereceden okunur. Takılı silahın AP'si AP paneline kendiliğinden dolar; gereken stat build toplamından yüksekse yuvada "Gerekli: DEX 168 (sende 70)" uyarısı çıkar. Derece verisi olmayan 334 eşyada (takılar, cospre vb.) yalnızca ad, kategori, sınıf ve görsel var.
- **Sınıf:** KO Bugda'nın `CanUseWarrior` … `CanUseKurian` bayraklarından gelir; hiçbir bayrağı olmayan eşya herkese açıktır. Kaynakta yanlış görünen kategoriler `katalog_olustur.py` içindeki `SINIF_DUZELTME` listesiyle düzeltilir (şimdilik "Priest Weapon / Mace" → yalnızca Priest; kaynakta Warrior, Mage ve Kurian da açık geliyordu). Prototipteki dağılım: Warrior 384, Rogue 352, Mage 354, Priest 393, Kurian 381 eşya.
- **Eşyalar sayfası (`/esyalar`):** Seçili sınıfın eşyaları yuva grubuna göre bölünür (Silah · Kalkan · Zırh parçaları · Takılar · Cospre); çok yuvalı gruplar yuva türüne göre alt bölümlere ayrılır (ör. Cospre: başlık, zırh, eldiven, kanat, dövme, amblem). Kartta ilk derecenin öne çıkan bonusları görünür. Karakter tasarımında da cospre yuvaları ayrı bölümdedir.
- **Setler:** Aynı `SetIdentifiers`'ı taşıyan 5 parça (kask, zırh, pantolon, eldiven, bot) bir settir; 62 set var, adları parça adlarının ortak kısmından çıkar (`katalog_olustur.py`, gerekirse `SET_ADI`). Bütün zırh parçaları (310) bir sete ait olduğundan zırhlar set olarak eklenir: Eşyalar'daki "Zırh setleri" grubu sınıfa uygun setleri kart olarak gösterir, "Seti tak" beş parçayı birlikte takar (yuvada derece varsa korunur), tek parça için kartaki ikona tıklanır. Set parçasının detayında da set bölümü ve "Seti tak" var. Karakter tasarımında Ekipman paneli bölümlere ayrılır (Silahlar · Zırh seti · Takılar · Cospre); "Zırh seti" bölümünün başlığında takılı set ve parça sayısı ("Mythril 5/5 · bonus aktif") ile set seçicisini açan "Set seç" düğmesi var; zırh yuvasının seçicisinde her satırda "Tüm set" düğmesi o parçanın setini tamamen takar.
- **Set bonusu:** Krowaz, Mythril ailesi (Rogue Mythril, Warrior Dragon Scale, Mage Ron's, Priest Trial), Secret, Holy Knight ve Rosetta setleri takılı parça kombinasyonuna göre ek bonus verir (stat, HP stat, can, mana, savunma, direnç). Tablolar eski KO Bugda gelişmiş hesaplayıcısından `scripts/kobugda_setler.py` ile `data/esyalar/kobugda/set_bonuslari.json`'a indirilir: sınıf + aile başına 32 satır, satır kimliği takılı parçaların bit toplamı (kask 1, zırh 2, pantolon 4, bot 8, eldiven 16). Eşyanın ailesi ve parçası `KrowazFlagId`'de: 5'er bitlik gruplar (grup = aile). Kurian, Warrior'ın kullanamadığı Portu parçalarında kendi tablosunu, diğerlerinde Warrior'ınkini kullanır. Draki Legion setlerinin bonusu eski KO Bugda'da hesaplanmıyor. Yeni kobugda.com/sets verisi (`/api/sets`, set başına sınıf + parça kombinasyonu → bonus) tarayıcıdan kaydedilip `data/esyalar/kobugda/api/` klasörüne konursa katalog betiği onu setlere bağlar: setin kendi tablosu önce gelir, takılı parçaların kapsadığı en büyük kombinasyonun bonusu verilir (KO Bugda'daki gibi); Draki Legion da böylece hesaba girer. Adres sunucudan doğrudan isteğe kapalı. Set bonusu hesap panelinde ayrı satırda ("Mythril · 4/5 parça") gösterilir ve statlara "+15 set" olarak eklenir.
- **Arama:** Türkçe küçük harf dönüşümünde "I" → "ı" olduğu için "Iron Bow" bulunamıyordu; arama artık ı/i farkını yok sayar. Karta tıklanınca detay açılır: derece tablosu (yalnızca dolu sütunlar), "Tak: <yuva>" düğmeleri. Build'in sınıfı eşyayı kullanamıyorsa düğmeler kapalıdır ve neden yazılır.
- CSV içe aktarma (`ID,Eşya Adı,Kategori,Slot,Görsel URL` biçimi de okunur); aynı ID tekrar yüklenirse güncellenir, tanınmayan yuva tipi hata olarak listelenir.
- JSON içe aktarma. Alanlar KO Bugda API'sinin biçimiyle eşlenir (`name`, `category`, `slot`, `handType`, `isOneHanded`, `canUseWarrior` … `canUseKurian`, `requiredLevel`, `requiredStr` …, `stats[].grade`, `stats[].attackPower`, `setParts`); böylece izinli bir kaynaktan alınan dosya doğrudan yüklenebilir.
- Ekipman yuvaları (19): Silah, İkinci el, Kask, Zırh, Pantolon, Eldiven, Bot, Kolye, Küpe ×2, Yüzük ×2, Kemer, Cospre başlık, Cospre zırh, Cospre eldiven, Kanat, Dövme, Amblem.
- Görseller: `data/esyalar/kobugda/gorseller/<ItemImageId>.png` (45×45); boş yuvada panelin kendi yuva ikonu. Çerçeve rengi dereceyi gösterir (Normal, Set, Unique, Rare, Draki, Cospre).

Telif ve izin: Oyun ikonları oyun şirketine ait; KO Bugda'nın eşya veritabanı ve API'si de onların emeği. Panel bu verileri izinsiz çekmez ve görselleri onların sunucusundan göstermez (hotlink yok). KO Bugda'dan izin alınırsa içe aktarma aracı bu biçimi zaten okuyor.

Nick, rütbe ve durum yetkililerdedir; nick oyunda farklı alındıysa üye bir yetkiliye yazar. Her değişiklik `character_changes` tablosuna yazılır (kim, hangi alan, eski ve yeni değer, zaman); yetkililer karakter detayında görür.

---

## 4. Teknoloji

| Katman | Seçim | Neden |
|---|---|---|
| Uygulama | **Next.js 16** (App Router, Server Actions) + TypeScript + React 19 | Tek repo, Vercel'de sıfır ayar |
| Stil | **Tailwind CSS 4**, tasarım token'ları `globals.css` içinde CSS değişkeni | Prototipteki token'lar birebir taşınır |
| Yazı tipleri | `next/font/google`: Cinzel (klan adı, başlık, geri sayım), Barlow Condensed (arayüz başlığı, etiket, sayı), Barlow (gövde) | Türkçe karakter desteği var |
| Veri + giriş | **Supabase** (Postgres + Auth e-posta/şifre, nick ile giriş + Row Level Security) | Ücretsiz katman yeterli, yetki kuralları veritabanında |
| Yayın | **Vercel** (ücretsiz) | Her PR için önizleme adresi |
| TeamSpeak bildirimi | TS3 **WebQuery** (TS3 sunucu 3.12+): `sendtextmessage` ile sunucuya ya da bir kanala mesaj. `TS3_WEBQUERY_URL`, `TS3_WEBQUERY_KEY` ortam değişkenleri, yalnızca sunucu tarafında. Yapılandırılmamışsa "TeamSpeak'e de gönder" kutusu gizlenir, "Metni kopyala" kalır | Bot kurmadan duyuru gönderimi |
| Test | Vitest (birim), Playwright (demo modunda duman testi) | |

### Demo modu (paralel çalışma için kritik)

Cloud oturumlarında Supabase bağlantısı olmayacak. Bu yüzden veri katmanı iki adaptörlü:

- `DATA_SOURCE=demo` → `lib/demo/fixtures.ts` içindeki örnek veriler (prototipteki 18 üye, etkinlikler, duyurular), bellek içinde.
- `DATA_SOURCE=supabase` → gerçek veritabanı.

Her özellik önce demo modunda çalışır ve test edilir. Supabase adaptörü aynı arayüzü uygular.

---

## 5. Veri modeli

Tek migration (`supabase/migrations/0001_init.sql`) Faz 0'da yazılır; Faz 1 oturumları şemayı değiştirmez.

```
profiles            id (auth.users), ts_nick?, yetki, son_giris?, created_at
characters          id, profile_id?, ad (unique), sinif, irk_turu?, level?, reb (0-10), rutbe, durum, ana_karakter, notlar, katilma_tarihi, guncellendi_at, guncelleyen
character_changes   id, character_id, alan (sinif | level | reb | ...), eski, yeni, degistiren, created_at
hazirlik            profile_id (pk), otp, on_kayit, sunucu_secimi, karakter_adi, klana_katildi, updated_at
milestones          id, sira, baslik, baslangic, bitis?, saat_belli, aciklama, kaynak_url
event_types         kod (pk), ad, kisa_ad, yoklama_var        -- csw, bdw, juraid, chaos, ft, boss, toplanti
events              id, tur → event_types, baslik, baslangic, bitis?, aciklama, schedule_id?, olusturan, created_at
recurring_schedules id, tur, baslik, gun (0-6), saat, sure_dk, aktif     -- haftalık düzen
attendance          event_id + character_id (pk), durum, isaretleyen, updated_at
announcements       id, baslik, govde, sabit, ts_gonderildi_at?, yazar, created_at
clan_settings       tek satır: klan_adi, yedek_ad?, monogram, irk (karus | el_morad), sunucu_adi?, ts_adres, level_siniri (80 | 83), reb_siniri (0-10)
invite_codes        id, kod_hash (unique), son_dort, rutbe (uye | aday), max_kullanim, kullanim, bitis, aktif, not, olusturan, created_at
invite_redemptions  id, code_id, profile_id, created_at
password_resets     id, profile_id, kod_hash, bitis, kullanildi_at?, olusturan, created_at
builds              id, character_id?, ad, sinif, irk_turu, level, reb, statlar jsonb {str,hp,dex,int,mp}, skiller int[4] (3 ağaç + master), ekipman jsonb {yuva: {item_id, arti}}, ap_girdileri jsonb, paylasim (klan | yetkili), sablon bool, olusturan, updated_at
items               id, dis_id? (ör. KO Bugda ID), ad, kategori, yuva, el_tipi, tek_elli bool, siniflar text[] (warrior | rogue | mage | priest | kurian; boş = hepsi), gerekli_level, gerekli_str, gerekli_hp, gerekli_dex, gerekli_int, gerekli_mp, derece (normal | magic | rare | unique | set), set_id?, gorsel_yolu? (kendi depomuzdaki görsel), kaynak_gorsel_url? (yalnızca kayıt, gösterilmez), not, kaynak, ekleyen, updated_at
item_stats          item_id + arti (0-10) (pk), ap, diger jsonb       -- artı seviyesine göre değerler
item_sets           id, ad, bonuslar jsonb
game_rules          anahtar (pk), deger jsonb, dogrulandi bool, kaynak?   -- stat_per_level, reb_bonus_stat, stat_cap, skill_start_level, skill_per_level, master_level, sinif_baslangic_statlari
class_trees         sinif, sira (1-4), ad                              -- ör. mage: Flame, Glacier, Lightning, Master
race_stats          irk_turu (pk), taraf (karus | el_morad), siniflar text[], str, hp, dex, int, mp, dogrulandi bool
```

Seed: `clan_settings` → `klan_adi = 'L4BEL'`, `monogram = 'L4'`, `ts_adres = 'L4B'`, `level_siniri = 80`, `reb_siniri = 0`. Klan adı kodda sabit yazılmaz; başlık, arma ve sayfa başlıkları bu satırdan okunur.

Enum'lar:
- `sinif`: warrior, rogue, mage, priest, kurian (El Morad'da Porutu; görüntülemede ırka göre ad değişir)
- `rutbe`: lider, asistan, subay, uye, aday

Terim: arayüzde karakter adı her yerde **Nick** olarak geçer (tablo başlığı, arama, kayıt ve profil formları); veritabanında sütun adı `characters.ad`.
- `durum` (karakter): aktif, izinli, pasif, ayrildi
- `yoklama`: katildi, gec, mazeretli, yok
- `yetki`: yonetici, yetkili, uye

RLS kuralları (özet):
- Okuma: `uye` ve üstü her tabloyu okur (`invite_codes` ve `invite_redemptions` hariç).
- Yazma: `characters`, `events`, `attendance`, `announcements`, `recurring_schedules` → `yetkili` ve üstü.
- Üyenin kendi karakteri: doğrudan tablo yazma yok; `profil_guncelle(sinif, level, reb)` fonksiyonu (SECURITY DEFINER) yalnızca `profile_id = auth.uid()` olan satırın bu alanlarını değiştirir, `level_siniri` ve `reb_siniri`'ni (reb yalnızca level 83'te) doğrular ve `character_changes`'e yazar. `profiles.ts_nick` üyenin kendisi tarafından yazılabilir.
- `hazirlik` → herkes yalnızca kendi satırını yazar.
- `invite_codes`, `invite_redemptions` → yalnızca `yetkili` ve üstü okur/yazar. Doğrulama ve kullanma `davet_dogrula(kod)` ve `davet_kullan(kod)` fonksiyonlarıyla, istemciye kod listesi hiç gitmez.
- `password_resets` → yalnızca `yetkili` ve üstü üretir; kullanma sunucu tarafında service role ile.
- `profiles.yetki`, `milestones`, `clan_settings` → yalnızca `yonetici`.

Katılım oranı = (katildi + gec) / işaretlenmiş yoklama sayısı. Mazeretli oranı düşürür ama ayrı gösterilir.

---

## 6. Sayfalar

| Yol | Sayfa | Prototipteki karşılığı |
|---|---|---|
| `/giris` | Nick + şifreyle giriş | Tuval: "Telefon · giriş ve davet koduyla kayıt" |
| `/kayit` | Davet koduyla kayıt, 4 adım | Aynı tuval ekranı |
| `/sifre-sifirla` | Nick + sıfırlama kodu + yeni şifre | yok |
| `/karakter` | Karakter tasarımı (build planlayıcı), klan şablonları | Karakter tasarımı sekmesi, tuvalde "Karakter tasarımı · build planlayıcı" |
| `/esyalar` | Sınıfa göre eşya kataloğu ve eşya detayı (derece tablosu, build'e takma) | Eşyalar sekmesi |
| `/profil` | Profilim: nick (kilitli), TS nick, sınıf, level, reb, şifre | Profilim sekmesi, tuvalde "Telefon · profilim" |
| `/` | Genel bakış (geri sayım, aşamalar, hazırlık, yaklaşanlar, sabit duyuru) | Genel bakış |
| `/uyeler` | Üye tablosu, sınıf dağılımı, rütbe özeti | Üyeler |
| `/uyeler/[id]` | Karakter detayı, katılım geçmişi | yok |
| `/etkinlikler` | Etkinlik listesi, tür bazında katılım, en istikrarlı üyeler | Etkinlikler ve katılım |
| `/etkinlikler/[id]` | Yoklama ekranı | Etkinlikler (sağ panel) |
| `/takvim` | Aylık takvim, haftalık düzen | Takvim ve duyurular |
| `/duyurular` | Duyuru listesi ve yazma formu | Takvim ve duyurular |
| `/ayarlar/esyalar` | Eşya kataloğu: ekle/düzenle, JSON/CSV içe aktar, görsel yükle | yok |
| `/ayarlar` | Açılış tarihleri, klan bilgisi, TS adresi, level sınırı (80 / 83 / 83+1 … 83+10), yetkiler, şifre sıfırlama kodu | Profilim sekmesindeki yönetici kutusu |
| `/ayarlar/davet-kodlari` | Kod üret, listele (son 4 hane, kullanım, bitiş), iptal et, kimin hangi kodla katıldığı | yok |

Tasarım kuralları [`design/palet.md`](../design/palet.md)'den gelir: tek koyu tema; marka rengi ırka göre (`data-irk`: Karus kırmızı-bordo, El Morad mavi-lacivert) ve birincil butonda, armada, aktif sekmede kullanılır; eski altın ödül, ilerleme ve öne çıkan sayılar için; rütbeler maden sırasıyla (altın, gümüş, bronz, demir); sınıf renkleri grafik serisinin ilk beşi, her zaman yazıyla birlikte; durumlar renk + ikon + etiketle. Üst barda kalkan içinde "L4" monogramı ve "L4BEL" yazısı.

---

## 7. Yol haritası ve paralel cloud oturumları

```
Faz 0  Temel altyapı          ──── 1 oturum (sıralı, diğerleri buna bağlı)
          │
Faz 1  ┌─ A: Üyeler + Profilim  ┐
       ├─ B: Etkinlik + yoklama │
       ├─ C: Takvim + duyurular │  5 paralel oturum, her biri kendi dalında
       ├─ D: Genel bakış + ayarlar + giriş/kayıt
       └─ E: Karakter tasarımı  ┘
          │
Faz 2  Entegrasyon ve yayın   ──── 1 oturum
```

### Faz 0: Temel altyapı (1 oturum)

Teslim edilecekler:
1. Next.js 16 + TS + Tailwind 4 + ESLint iskeleti, `npm run lint | typecheck | test | build` komutları.
2. `app/globals.css`: `design/tokens.css`'teki tüm renk ve yazı token'ları (tek koyu tema, ırk `clan_settings.irk`'ten `data-irk` olarak).
3. Ortak arayüz parçaları `components/ui/`: Panel, Button, Tag, Pill (durum), ClassChip, Segmented, DateBlock, Meter, Tooltip, Toast.
4. Uygulama kabuğu `app/(panel)/layout.tsx`: arma + klan adı, sekmeler, kullanıcı rozeti; her sayfa için boş yer tutucu.
5. `supabase/migrations/0001_init.sql` (tüm şema + RLS + `profil_guncelle`, `davet_dogrula`, `davet_kullan` fonksiyonları + seed: event_types, milestones, clan_settings) ve `lib/database.types.ts`.
6. Veri katmanı arayüzleri `lib/data/*.ts` (fonksiyon imzaları + demo adaptörü) ve `lib/demo/fixtures.ts` (klan adı L4BEL, prototipteki örnek üyeler).
7. `lib/auth.ts`: `getCurrentUser()`, `requireYetki(min)`, nick → iç e-posta ile giriş, kayıt sırasında `davet_kullan()` + kullanıcı oluşturma (service role yalnızca sunucuda), şifre sıfırlama; demo modunda prototipteki "Yetkili / Üye" anahtarı gibi çerezle değişen sahte kullanıcı.
8. `lib/time.ts`: TSİ biçimlendirme, "3 gün sonra" gibi göreli tarih, açılış öncesi/sonrası tespiti (birim testli).
9. GitHub Actions: lint, typecheck, test, build.
10. `README.md`: yerel çalıştırma (demo modu), ortam değişkenleri.

### Faz 1: Paralel oturumlar

Her oturum Faz 0'ın birleştiği `main` dalından başlar, kendi dalında çalışır ve PR açar. **Yalnızca kendi klasörlerine yazar.** Ortak dosyada değişiklik gerekiyorsa (ör. `components/ui`) PR açıklamasında belirtir, kendisi değiştirmez; ihtiyaç Faz 2'de toplanır.

| Oturum | Dal | Sahip olduğu dosyalar | Kabul kriterleri |
|---|---|---|---|
| **A: Üyeler + Profilim** | `feat/uyeler` | `app/(panel)/uyeler/**`, `app/(panel)/profil/**`, `components/uyeler/**`, `lib/data/members.ts` (supabase adaptörü) | Filtre + arama, sınıf dağılımı, rütbe özeti, hazırlık sütunu (açılış öncesi) / level sütunu (sonrası), karakter ekle-düzenle formu (Server Action + doğrulama), karakter detayında katılım geçmişi ve değişiklik kaydı; Profilim: kilitli nick, TS nick, sınıf, level (açılış öncesi kapalı, yönetici sınırına kadar), reb (yalnızca 83'te, reb sınırına kadar, "83+N" gösterimi), şifre değiştirme, kaydedince üye listesine yansıma, başkasının profilini değiştirememe testi |
| **B: Etkinlik + yoklama** | `feat/etkinlikler` | `app/(panel)/etkinlikler/**`, `components/etkinlikler/**`, `lib/data/events.ts`, `lib/data/attendance.ts` | Yaklaşan/geçmiş listesi, etkinlik oluştur-düzenle, yoklama ekranı (tek tıkla işaretleme, iyimser güncelleme, toplu işlemler), tür bazında katılım grafiği, en istikrarlı 5 üye, üyeler için salt okunur görünüm |
| **C: Takvim + duyurular** | `feat/takvim-duyurular` | `app/(panel)/takvim/**`, `app/(panel)/duyurular/**`, `components/takvim/**`, `components/duyurular/**`, `lib/data/announcements.ts`, `lib/data/schedule.ts`, `lib/teamspeak/**` | Aylık takvim + telefonda ajanda, haftalık düzen düzenleme ve "bu haftanın etkinliklerini oluştur", duyuru yaz/sabitle/sil, TeamSpeak WebQuery ile gönderim (yapılandırılmamışsa kutucuk gizli; hata durumunda kullanıcıya açık mesaj), "Metni kopyala" düğmesi, WebQuery birim testi (fetch mock) |
| **D: Genel bakış + ayarlar + kayıt** | `feat/genel-ayarlar` | `app/(panel)/page.tsx`, `app/(panel)/ayarlar/**`, `app/kayit/**`, `app/giris/**`, `app/sifre-sifirla/**`, `components/genel/**`, `components/kayit/**`, `lib/data/milestones.ts`, `lib/data/prep.ts`, `lib/data/settings.ts`, `lib/data/invites.ts` | Geri sayım (istemci bileşeni, saniyelik), aşama zaman çizelgesi, klan hazırlığı + "benim hazırlığım" (açılıştan sonra "L4BEL'e katıldım" adımı eklenir), açılış sonrası özet kutuları; Giriş (nick + şifre), Kayıt: 4 adımlı akış (kod, hesap, karakter, hoş geldin), tek tip hata mesajı, deneme sınırı, şifre sıfırlama; ana sayfada TeamSpeak kartı (L4B, kopyala); Ayarlar: açılış tarihleri, klan adı/ırk, TS adresi, level sınırı seçimi, yetki verme, davet kodu ve sıfırlama kodu üret/listele/iptal |
| **E: Karakter tasarımı** | `feat/karakter` | `app/(panel)/karakter/**`, `app/(panel)/esyalar/**`, `app/(panel)/ayarlar/esyalar/**`, `components/karakter/**`, `lib/data/builds.ts`, `lib/data/items.ts`, `lib/rules/**` | Sınıf, level ve reb seçimi; stat dağıtımı (5 stat, kalan puan, 255 sınırı başlangıç statları girilince); skill dağıtımı (3 ağaç + master; ağaç başına level sınırı, master level − 60 en fazla 23); stat ve skill için elle yazılabilir kutular; level düşünce fazla puan uyarısı ve kaydetmenin kapanması; ekipman yuvaları (19 yuva: 13 ekipman + 6 cospre, katalogdan, derece seçimli); tek tıkla set takma ve parça kombinasyonuna göre set bonusu (`set_bonuslari` tablosu); paylaşım seçimi; yetkili şablonları (oluştur, sınıfa göre listele, üyenin planına yükle); tüm sayılar `game_rules` ve `class_trees` tablolarından, kodda sabit yok; puan hesabı için birim testleri; eşya seçici (yalnızca build'in sınıfı, arama, level filtresi, derece, uyumsuzluk uyarısı); Eşyalar sayfası (`app/(panel)/esyalar/**`: sınıf sekmeleri, yuva grubu ve derece filtresi, detay ve build'e takma); otomatik hesap paneli (AP, savunma, can, mana, direnç; eşya ve takı bonusları, hesap tipi sınıf ve silahtan, WES/Wolf/ek stat/ek %; referans hesapla karşılaştırmalı birim testi); Ayarlar › Eşya kataloğu (ekle, JSON/CSV içe aktar, görsel yükle); KO Bugda bağlantısı |

Ortak kurallar:
- Her oturum bitmeden önce `lint`, `typecheck`, `test`, `build` temiz geçmeli.
- Demo modunda ekranlar prototiple aynı düzende olmalı; PR'a ekran görüntüsü (masaüstü + 400px telefon) eklenmeli.
- Metinler Türkçe, saatler TSİ.
- Başka oturumun klasörüne dokunulmaz.

### Faz 2: Entegrasyon ve yayın (1 oturum)

1. PR'ları sırayla birleştir (A → B → C → D), çakışmaları çöz, ortak bileşen isteklerini topla.
2. Playwright duman testi (demo modunda tüm sayfalar, iki ırk rengi, telefon genişliği, giriş, davet koduyla kayıt, level sınırı).
3. Kurulum rehberi: Supabase projesi (e-posta onayı kapalı), Vercel ortam değişkenleri, isteğe bağlı TeamSpeak WebQuery anahtarı.
4. İlk yöneticiyi atama betiği (`scripts/ilk-yonetici.sql`).

### Kullanıcının (klan liderinin) yapması gerekenler

Kod tarafı oturumlarla ilerler; aşağıdakiler hesap sahibinin işi:
- Supabase projesi açıp URL ve anahtarları Vercel'e girmek
- (İsteğe bağlı) TeamSpeak sunucusunda WebQuery'yi açıp bir API anahtarı üretmek; duyurular TS'e otomatik gitsin diye. Bunun için sunucu yöneticisi erişimi gerekir
- Vercel'de repoyu bağlamak

---

## 8. Açık sorular

Klan adı netleşti: **L4BEL**.

1. Arma: şimdilik kalkan içinde "L4" monogramı. Klanın bir logosu var mı?
2. Yedek klan adı ne olsun? (Açılışta L4BEL başkası tarafından alınırsa)
3. Irk: Karus mu El Morad mı? (Sınıf adları ve renk vurgusu buna göre)
4. Rütbe adları prototipteki gibi mi kalsın (Lider, Asistan, Subay, Üye, Aday)?
5. Davet kodları varsayılan olarak kaç gün geçerli olsun, kaç kişi kullanabilsin? (Öneri: 7 gün, 25 kullanım)
6. Haftalık etkinlik saatleri sunucu açılınca belli olacak; prototipteki saatler örnek.
7. TeamSpeak sunucusunda (L4B) yönetici erişiminiz var mı? Varsa duyurular TS'e otomatik gönderilebilir, ileride kim TS'te bağlı ya da AFK panelde görünebilir.
8. Karakter tasarımı kuralları: level başına skill puanı (2 mi?), Kurian'ın başlangıç statları (Porutu ile aynı mı?) ve Kurian/Porutu skill ağaçlarının adları. Klandan deneyimli biri doğrulayabilir mi?
9. Eşya verisi: KO Bugda'dan eşya listesini kullanma izni alınabilir mi? Alınırsa içe aktarma hazır; alınmazsa katalog yöneticiler tarafından doldurulur.
