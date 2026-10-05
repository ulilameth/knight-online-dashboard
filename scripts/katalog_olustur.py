"""KO Bugda verisinden prototipin okuduğu küçük katalogu üretir.

Girdi:  data/esyalar/kobugda/{esyalar,istatistikler,kategoriler}.json
        data/esyalar/kobugda/api/*.json (isteğe bağlı: kobugda.com/api/items yanıtları, tarayıcıdan kaydedilir;
        eski veride istatistiği olmayan takı ve cospre eşyalarını tamamlar)
Çıktı:  design/katalog.json

Çalıştırma: python3 scripts/katalog_olustur.py
"""
import glob
import json
import os
import re

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
# Yuva düzeltmesi: oyunda yay sol elde durur ama tek silahtır; planlayıcıda Silah yuvasına takılır
# (AP hesabı Archer tipinde yayın AP'sini tam sayar, KO Bugda gelişmiş hesaplayıcıdaki gibi).
YUVA_DUZELTME = {"Bow": ["silah"]}
# Derece satırındaki alanlar (sıra önemli; prototip bu sırayla okur)
# BonusHealth/BonusMagicPower stat puanı, BonusHp/BonusMp can ve mana puanıdır. Satır sonundaki sıfırlar atılır.
STAT_FIELDS = ["AttackPower", "Defense", "RequiredLevel", "RequiredStrength", "RequiredHealth", "RequiredDexterity",
               "RequiredIntelligence", "RequiredMagicPower", "BonusStrength", "BonusHealth", "BonusDexterity",
               "BonusIntelligence", "BonusMagicPower", "BonusHp", "BonusMp", "BonusAc", "DamagePercentage",
               "DefensePercentage", "DamageFlame", "DamageGlacier", "DamageLighting", "DamagePoison",
               "ResistanceFlame", "ResistanceGlacier", "ResistanceLighting", "ResistancePoison", "ResistanceDark",
               "ResistanceMagic", "HpRecovery", "MpRecovery", "DodgingRate", "RepelPhysicalAttack",
               "DefenseSword", "DefenseDagger", "DefenseClub", "DefenseAxe", "DefenseSpear", "DefenseArrow",
               "DefenseJamadar"]
# kobugda.com/api/items alan adları (STAT_FIELDS ile aynı sıra). Gereken level ve statlar API'de eşya düzeyinde.
API_FIELDS = ["attackPower", "defense", "requiredLevel", "requiredStr", "requiredHp", "requiredDex", "requiredInt",
              "requiredMp", "bonusStr", "bonusHealth", "bonusDex", "bonusInt", "bonusMagicPower", "bonusHp", "bonusMp",
              "bonusAc", "damagePercentage", "defensePercentage", "flameDamage", "glacierDamage", "lightningDamage",
              "poisonDamage", "resistFlame", "resistGlacier", "resistLightning", "resistPoison", "resistDark",
              "resistMagic", "hpRecovery", "mpRecovery", "dodgingRate", "repelPhysicalAttack",
              "defenseSword", "defenseDagger", "defenseClub", "defenseAxe", "defenseSpear", "defenseArrow",
              "defenseJamadar"]
# API kategorisi -> (eski veri kategori adı, yuvalar). Silahlarda el tipi ayrıca bakılır.
API_CAT = {
    "RING": ("Ring", ["yuzuk"]), "EARRING": ("Earring", ["kupe"]), "NECKLACE": ("Necklace", ["kolye"]),
    "BELT": ("Belt", ["kemer"]), "WINGS": ("Wings", ["kanat"]), "TATTOO": ("Tattoo", ["dovme"]),
    "EMBLEM": ("Emblems", ["amblem"]), "PATHOS": ("Cospre - Pathos Gloves", ["cospre_eldiven"]),
    "VALKYRIE_HELM": ("Cospre - Armors", ["cospre_kask"]), "VALKYRIE_PAULDRON": ("Cospre - Armors", ["cospre_zirh"]),
    "HELM": ("Helmet", ["kask"]), "PAULDRON": ("Pauldron", ["zirh"]), "PADS": ("Pads", ["pantolon"]),
    "GAUNTLETS": ("Gauntlets", ["eldiven"]), "BOOTS": ("Boots", ["bot"]), "SHIELD": ("Shield", ["ikinci"]),
    "WEAPON_BOW": ("Bow", ["silah"]), "WEAPON_CROSSBOW": ("Crossbow", ["silah"]), "WEAPON_STAFF": ("Staff", ["silah"]),
    "WEAPON_PRIEST": ("Priest Weapon / Mace", ["silah", "ikinci"]), "WEAPON_DAGGER": ("Dagger", ["silah", "ikinci"]),
    "WEAPON_JAMADAR": ("Jamadar", ["silah", "ikinci"]),
}
API_HANDED = {"WEAPON_SWORD": "Sword", "WEAPON_AXE": "Axe", "WEAPON_CLUB": "Club", "WEAPON_SPEAR": "Spear"}
API_COSPRE = {"WINGS", "TATTOO", "EMBLEM", "PATHOS", "VALKYRIE_HELM", "VALKYRIE_PAULDRON"}
API_CLASS = [("canUseWarrior", "war"), ("canUseRogue", "rog"), ("canUseMage", "mag"), ("canUsePriest", "pri"), ("canUseKurian", "kur")]


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


def effect_text(v):
    """Curse alanı sayı değil, olasılıklı etki metni: "Attack Hour 1% probability before Deadman's Call"."""
    if not isinstance(v, str) or not v.strip():
        return None
    m = re.match(r"(Attack|Damage) Hour %?(\d+)%? probability befor?e? (.+)", v.strip())
    if not m:
        return v.strip()
    return f"{'Saldırırken' if m[1] == 'Attack' else 'Hasar alırken'} %{m[2]} ihtimalle: {m[3]}"


def trim(row):
    while len(row) > 1 and not row[-1]:
        row.pop()
    return row


def api_items():
    """data/esyalar/kobugda/api/*.json içindeki API yanıtlarını okur (liste, {data: [...]} ya da {data: {data: [...]}})."""
    out = {}
    for path in sorted(glob.glob(os.path.join(SRC, "api", "*.json"))):
        d = json.load(open(path, encoding="utf-8"))
        while isinstance(d, dict):
            d = d.get("data", [])
        for it in d:
            key = it.get("legacyId") or it.get("id")
            if key is not None:
                out[key] = it
    return out


def api_rows(it):
    rows = []
    for st in it.get("stats") or []:
        row = [st.get("grade", 0)]
        for f in API_FIELDS:
            v = st.get(f)
            if v is None and f.startswith("required"):
                v = it.get(f)
            row.append(v or 0)
        rows.append(trim(row))
    return sorted(rows, key=lambda r: r[0])


def api_slots(it):
    cat = it.get("category")
    if cat in API_HANDED:
        two = it.get("handType") == "TWO_HAND" or it.get("isOneHanded") is False
        return f"{API_HANDED[cat]} - {'2H' if two else '1H'}", ["silah"] if two or cat == "WEAPON_SPEAR" else ["silah", "ikinci"]
    return API_CAT.get(cat, (None, None))


def main():
    items = json.load(open(os.path.join(SRC, "esyalar.json"), encoding="utf-8"))
    cats = {c["Identifier"]: c for c in json.load(open(os.path.join(SRC, "kategoriler.json"), encoding="utf-8"))}
    stats = json.load(open(os.path.join(SRC, "istatistikler.json"), encoding="utf-8"))

    by_item, effects = {}, {}
    for row in stats.values():
        g = row["ItemGrade"]
        if effect_text(row.get("Curse")):
            effects[row["ItemId"]] = effect_text(row.get("Curse"))
        by_item.setdefault(row["ItemId"], {})[g["Grade"]] = trim([g["Grade"]] + [row.get(f) or 0 for f in STAT_FIELDS])

    out_items, unknown = [], set()
    for it in items:
        cat = cats[it["ItemTypeId"]]
        slot_type = (it.get("ItemSlotType") or {}).get("SlotType")
        if cat["Name"] in YUVA_DUZELTME:
            slots = YUVA_DUZELTME[cat["Name"]]
        elif slot_type == "Weapon / Shield":
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
            **({"ef": effects[it["Identifier"]]} if it["Identifier"] in effects else {}),
        })

    stat_out = {str(k): [v[gr] for gr in sorted(v)] for k, v in by_item.items()}

    # API verisi: eski veride derecesi olmayan eşyaları tamamlar, eski veride hiç olmayanları ekler
    api = api_items()
    known = {x["id"] for x in out_items}
    filled = added = 0
    for key, it in api.items():
        rows = api_rows(it)
        ef = next((effect_text(st.get("curse")) for st in it.get("stats") or [] if effect_text(st.get("curse"))), None)
        if key in known:
            if ef:
                next(x for x in out_items if x["id"] == key).setdefault("ef", ef)
            if rows and str(key) not in stat_out:
                stat_out[str(key)] = rows
                filled += 1
            continue
        cat_name, slots = api_slots(it)
        if not slots:
            unknown.add(it.get("category"))
            continue
        key = key if isinstance(key, int) else f"api-{key}"
        out_items.append({
            "id": key, "n": it.get("name", "?"), "k": cat_name, "s": slots,
            "c": SINIF_DUZELTME.get(cat_name) or [code for flag, code in API_CLASS if it.get(flag)],
            "i": None, "g": "cospre" if it.get("category") in API_COSPRE else "normal", "set": None,
            **({"ef": ef} if ef else {}),
        })
        if rows:
            stat_out[str(key)] = rows
        added += 1
    if api:
        print(f"API: {len(api)} eşya okundu, {filled} eşyanın derecesi tamamlandı, {added} yeni eşya eklendi")
    json.dump({"kaynak": "KO Bugda (old.kobugda.com)", "alanlar": ["derece"] + STAT_FIELDS,
               "esyalar": out_items, "dereceler": stat_out},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"{len(out_items)} eşya, {len(stat_out)} eşyada derece verisi -> {OUT}")
    if unknown:
        print("eşlenmeyen yuva tipleri:", unknown)


if __name__ == "__main__":
    main()
