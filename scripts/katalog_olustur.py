"""KO Bugda verisinden prototipin okuduğu küçük katalogu üretir.

Girdi:  data/esyalar/kobugda/{esyalar,istatistikler,kategoriler}.json
Çıktı:  design/katalog.json

Çalıştırma: python3 scripts/katalog_olustur.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "data", "esyalar", "kobugda")
OUT = os.path.join(ROOT, "design", "katalog.json")

# KO Bugda yuva tipi -> panel yuvası. "Weapon / Shield" kategoriye göre ayrılır.
SLOT = {
    "Helmet": "kask", "Pauldron": "zirh", "Pads": "pantolon", "Gauntlets": "eldiven", "Boots": "bot",
    "Necklace": "kolye", "Earring": "kupe", "Ring": "yuzuk", "Belt": "kemer",
    "ValkirieHelmet": "cospre_kask", "ValkiriePauldron": "cospre_zirh", "PathosGlove": "cospre_eldiven",
    "Wings": "kanat", "Tattoo": "dovme", "Emblem": "amblem",
}
CLASS_FLAGS = [("CanUseWarrior", "war"), ("CanUseRogue", "rog"), ("CanUseMage", "mag"), ("CanUsePriest", "pri"), ("CanUseKurian", "kur")]
# KO Bugda'nın sınıf bayrağı yanlış görünen kategoriler: kategori -> doğru sınıflar.
# "Priest Weapon / Mace" kaynakta Warrior, Mage ve Kurian için de açık geliyor; oyunda yalnızca Priest kullanır.
SINIF_DUZELTME = {"Priest Weapon / Mace": ["pri"]}
# Derece satırındaki alanlar (sıra önemli; prototip bu sırayla okur)
STAT_FIELDS = ["AttackPower", "Defense", "RequiredLevel", "RequiredStrength", "RequiredHealth", "RequiredDexterity",
               "RequiredIntelligence", "RequiredMagicPower", "BonusStrength", "BonusHealth", "BonusDexterity",
               "BonusIntelligence", "BonusMagicPower"]


def grade_of(it, cospre):
    if cospre:
        return "cospre"
    if it["IsDraki"]:
        return "draki"
    if it["IsRare"]:
        return "rare"
    if it["IsUnique"]:
        return "unique"
    if it["SetIdentifiers"]:
        return "set"
    return "normal"


def main():
    items = json.load(open(os.path.join(SRC, "esyalar.json"), encoding="utf-8"))
    cats = {c["Identifier"]: c for c in json.load(open(os.path.join(SRC, "kategoriler.json"), encoding="utf-8"))}
    stats = json.load(open(os.path.join(SRC, "istatistikler.json"), encoding="utf-8"))

    by_item = {}
    for row in stats.values():
        g = row["ItemGrade"]
        by_item.setdefault(row["ItemId"], {})[g["Grade"]] = [row.get(f) or 0 for f in STAT_FIELDS]

    out_items, unknown = [], set()
    for it in items:
        cat = cats[it["ItemTypeId"]]
        slot_type = (it.get("ItemSlotType") or {}).get("SlotType")
        if slot_type == "Weapon / Shield":
            slots = (["silah"] if cat["CanEquipRight"] or cat["CanEquipNormal"] else []) + (["ikinci"] if cat["CanEquipLeft"] else [])
        elif slot_type in SLOT:
            slots = [SLOT[slot_type]]
        else:
            unknown.add(slot_type)
            continue
        out_items.append({
            "id": it["Identifier"],
            "n": it["Name"],
            "k": cat["Name"],
            "s": slots,
            "c": SINIF_DUZELTME.get(cat["Name"]) or [code for flag, code in CLASS_FLAGS if it[flag]],
            "i": it["ItemImageId"],
            "g": grade_of(it, cat["IsCospre"]),
            "set": it["SetIdentifiers"] or None,
        })

    stat_out = {str(k): [[gr] + v[gr] for gr in sorted(v)] for k, v in by_item.items()}
    json.dump({"kaynak": "KO Bugda (old.kobugda.com)", "alanlar": ["derece"] + STAT_FIELDS,
               "esyalar": out_items, "dereceler": stat_out},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"{len(out_items)} eşya, {len(stat_out)} eşyada derece verisi -> {OUT}")
    if unknown:
        print("eşlenmeyen yuva tipleri:", unknown)


if __name__ == "__main__":
    main()
