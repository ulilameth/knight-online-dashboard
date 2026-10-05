#!/usr/bin/env python3
"""KO Bugda (old.kobugda.com) eşya verisini ve görsellerini çeker.

Kullanım:  python3 scripts/kobugda_scrape.py [aşama]
  aşama: items  -> kategoriler, eşyalar, görseller
         grades -> her eşyanın dereceleri (GetItemGrades)
         stats  -> her eşya/derece için istatistik (GetItemStats)
         all    -> hepsi (varsayılan)

Çıktı: data/esyalar/kobugda/  (ham veri .cache/ altında tutulur, yeniden çalıştırınca devam eder)
Sunucuya yük bindirmemek için az sayıda paralel istek ve kısa bekleme kullanılır.
"""
import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "https://old.kobugda.com/Calculator"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "esyalar", "kobugda")
CACHE = os.path.join(ROOT, ".cache")
IMG_DIR = os.path.join(ROOT, "gorseller")
UA = "Mozilla/5.0 (knight-online-dashboard data import)"
WORKERS = 4
DELAY = 0.05


def post(path, form=None, js=None, retries=4):
    if js is not None:
        data = json.dumps(js).encode()
        ctype = "application/json; charset=utf-8"
    else:
        data = urllib.parse.urlencode(form or {}).encode()
        ctype = "application/x-www-form-urlencoded; charset=UTF-8"
    req = urllib.request.Request(
        f"{BASE}/{path}", data=data,
        headers={"User-Agent": UA, "Content-Type": ctype, "X-Requested-With": "XMLHttpRequest"},
    )
    for n in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            time.sleep(DELAY)
            return json.loads(body) if body else []
        except Exception:
            if n == retries - 1:
                raise
            time.sleep(2 ** n)


def load(name, default):
    p = os.path.join(CACHE, name)
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else default


def save(name, obj):
    os.makedirs(CACHE, exist_ok=True)
    with open(os.path.join(CACHE, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)


def phase_items():
    os.makedirs(IMG_DIR, exist_ok=True)
    cats = post("GetItemCategories", js={})
    save("categories.json", cats)
    items = []
    images = {}
    for c in cats:
        rows = post("GetItemsByCategories", form={"category": c["Identifier"]})
        print(f"  {c['Name']}: {len(rows)} eşya")
        for it in rows:
            img = it.pop("ItemImage", None)
            if img and img.get("Img"):
                images[it["ItemImageId"]] = bytes(img["Img"])
            it["CategoryName"] = c["Name"]
            items.append(it)
    for iid, blob in images.items():
        with open(os.path.join(IMG_DIR, f"{iid}.png"), "wb") as f:
            f.write(blob)
    save("items.json", items)
    print(f"items: {len(items)} eşya, {len(images)} görsel")


def phase_grades():
    items = load("items.json", [])
    done = load("grades.json", {})
    todo = [i for i in items if str(i["Identifier"]) not in done]

    def run(it):
        out = []
        for normal in ("true", "false"):
            rows = post("GetItemGrades", form={
                "isNormal": normal, "isUnique": str(it["IsUnique"]).lower(),
                "isDraki": str(it["IsDraki"]).lower(), "itemId": it["Identifier"]})
            out.extend(rows)
        return str(it["Identifier"]), out

    with ThreadPoolExecutor(WORKERS) as ex:
        for n, (k, v) in enumerate(ex.map(run, todo), 1):
            done[k] = v
            if n % 200 == 0:
                save("grades.json", done)
                print(f"  grades {n}/{len(todo)}")
    save("grades.json", done)
    print(f"grades: {len(done)} eşya")


def phase_stats():
    grades = load("grades.json", {})
    done = load("stats.json", {})
    pairs = []
    seen = set()
    for iid, gs in grades.items():
        for g in gs:
            if (iid, g["Identifier"]) not in seen:
                seen.add((iid, g["Identifier"]))
                pairs.append((iid, g["Identifier"]))
    todo = [p for p in pairs if f"{p[0]}:{p[1]}" not in done]
    print(f"stats: {len(pairs)} çift, {len(todo)} kaldı")

    def run(p):
        rows = post("GetItemStats", js={"itemId": int(p[0]), "gradeId": p[1]})
        if rows:
            rows[0].pop("Item", None)
        return f"{p[0]}:{p[1]}", rows[0] if rows else None

    with ThreadPoolExecutor(WORKERS) as ex:
        for n, (k, v) in enumerate(ex.map(run, todo), 1):
            done[k] = v
            if n % 500 == 0:
                save("stats.json", done)
                print(f"  stats {n}/{len(todo)}")
    save("stats.json", done)


def export():
    items = load("items.json", [])
    grades = load("grades.json", {})
    stats = load("stats.json", {})
    os.makedirs(ROOT, exist_ok=True)
    cats = load("categories.json", [])
    json.dump(cats, open(os.path.join(ROOT, "kategoriler.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(items, open(os.path.join(ROOT, "esyalar.json"), "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(grades, open(os.path.join(ROOT, "dereceler.json"), "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(stats, open(os.path.join(ROOT, "istatistikler.json"), "w", encoding="utf-8"), ensure_ascii=False)
    by_id = {str(i["Identifier"]): i for i in items}
    cols = None
    rows = []
    for k, s in stats.items():
        if not s:
            continue
        it = by_id.get(k.split(":")[0], {})
        g = s.get("ItemGrade") or {}
        row = {"ItemId": s["ItemId"], "Name": it.get("Name"), "Category": it.get("CategoryName"),
               "Grade": g.get("Grade"), "GradeComment": g.get("Comment"), "IsReverse": g.get("IsReverse"),
               "ImageFile": f"gorseller/{it.get('ItemImageId')}.png"}
        row.update({a: b for a, b in s.items() if a not in ("ItemGrade", "Item")})
        rows.append(row)
        cols = cols or list(row.keys())
    if rows:
        allcols = list(dict.fromkeys(c for r in rows for c in r))
        with open(os.path.join(ROOT, "istatistikler.csv"), "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=allcols)
            w.writeheader()
            w.writerows(rows)
    print(f"export: {len(items)} eşya, {len(rows)} istatistik satırı")


if __name__ == "__main__":
    step = sys.argv[1] if len(sys.argv) > 1 else "all"
    if step in ("items", "all"):
        phase_items()
    if step in ("grades", "all"):
        phase_grades()
    if step in ("stats", "all"):
        phase_stats()
    export()
