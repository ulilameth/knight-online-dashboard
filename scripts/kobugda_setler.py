"""old.kobugda.com gelişmiş hesaplayıcısındaki set bonusu tablolarını indirir ve JSON'a çevirir.

Kaynak: https://old.kobugda.com/Calculator/Calculator sayfasının yüklediği /bundles/setsdata dosyası.
Tablolar sınıf + set ailesi başına 32 satır: satırın kimliği takılı parçaların bit toplamıdır
(kask 1, zırh 2, pantolon 4, bot 8, eldiven 16), satır o kombinasyonun bonusunu verir.
Eşyanın hangi aileye ve parçaya düştüğü esyalar.json'daki KrowazFlagId alanında (bkz. katalog_olustur.py).

Çıktı: data/esyalar/kobugda/set_bonuslari.json
Çalıştırma: python3 scripts/kobugda_setler.py
"""
import json
import os
import re
import urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "data", "esyalar", "kobugda", "set_bonuslari.json")
BASE = "https://old.kobugda.com"
UA = {"User-Agent": "Mozilla/5.0 (L4BEL klan paneli; set bonusu tablosu)"}


def get(path):
    req = urllib.request.Request(BASE + path, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def main():
    page = get("/Calculator/Calculator")
    src = re.search(r'src="(/bundles/setsdata\?v=[^"]+)"', page)
    if not src:
        raise SystemExit("setsdata dosyası sayfada bulunamadı")
    js = get(src.group(1))
    tables = {}
    for name, body in re.findall(r"\b([A-Z]+(?:_[A-Z]+)+)=(\[.*?\])(?=[,;]\s*(?:[A-Z]+_[A-Z_]+=|$|function|var))", js, re.S):
        # JS nesne sözdizimi -> JSON: tırnaksız anahtarları tırnakla
        text = re.sub(r"([{,])\s*([A-Za-z_]\w*)\s*:", r'\1"\2":', body)
        rows = json.loads(text)
        tables[name] = {str(r["id"]): {"bonus": r["bonuses"], "parcalar": r.get("comment", "")} for r in rows}
    if not tables:
        raise SystemExit("tablo okunamadı")
    json.dump({"kaynak": BASE + src.group(1).split("?")[0], "tablolar": tables},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(tables)} tablo -> {OUT}: {', '.join(sorted(tables))}")


if __name__ == "__main__":
    main()
