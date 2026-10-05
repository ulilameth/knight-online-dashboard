"""KO Bugda verisinden prototipin okuduğu küçük katalogu üretir.

Girdi:  data/esyalar/kobugda/{esyalar,istatistikler,kategoriler}.json
        data/esyalar/kobugda/set_bonuslari.json (scripts/kobugda_setler.py ile indirilir)
        data/esyalar/kobugda/api/*.json (isteğe bağlı: kobugda.com/api/items ve /api/sets yanıtları, tarayıcıdan
        kaydedilir; eski veride istatistiği olmayan takı ve cospre eşyalarını tamamlar, set bonuslarını günceller)
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
# Set bonusu: KrowazFlagId 5'er bitlik gruplara bölünür; grup = set ailesi, gruptaki bit = parça
# (kask 1, zırh 2, pantolon 4, bot 8, eldiven 16). Aile -> set_bonuslari.json'daki tablo eki.
# 6. aile (Draki Legion) eski KO Bugda'da hesaplanmıyor; bonusu bilinmiyor.
SET_AILE = ["KROWAZ", "BASIC", "SECRET", "HOLY_KNIGHT", "ROSETTA"]
SET_AILE_ADI = {"KROWAZ": "Krowaz", "BASIC": "Mythril ailesi", "SECRET": "Secret", "HOLY_KNIGHT": "Holy Knight", "ROSETTA": "Rosetta"}
# Set bonusu satırı alanları (prototip FEATS sütunlarına bu sırayla eklenir)
SET_ALAN = ["str", "health", "dex", "int", "magicpower", "hp", "mp", "ac",
            "resfire", "resglacier", "reslighting", "respoison", "resdark", "resmagic"]
# Parça adlarından çıkan set adı yetersizse
SET_ADI = {"147,148,149,150,151": "Mage Cloth/Cotton", "454,455,456,457,458": "Mage Leather/Linen",
           "152,153,154,155,156": "Fabric (Priest)", "403,404,405,406,407": "Holy Knight Assassin",
           "674,675,676,677,678": "Rogue Plate"}
# kobugda.com/api/sets: set başına sınıf ve parça kombinasyonu (piecesRequired, bitleri yukarıdaki gibi) -> bonus.
# Alanlar SET_ALAN sırasında.
API_SET_FIELDS = ["bonusStr", "bonusHealth", "bonusDex", "bonusInt", "bonusMagicPower", "bonusHp", "bonusMp", "bonusAc",
                  "resistFlame", "resistGlacier", "resistLightning", "resistPoison", "resistDark", "resistMagic"]
API_SET_CLASS = {"WARRIOR": "war", "ROGUE": "rog", "MAGE": "mag", "PRIEST": "pri", "KURIAN": "kur", "PORTU": "kur"}
SET_PREFIX = {"war": "WARRIOR", "rog": "ROGUE", "mag": "MAGE", "pri": "PRIEST", "kur": "KURIAN"}
# Sahibinin nick'ini taşıyan unique silahlar ("KOBugda's Azagai", "Dagger of KOBugda"): KO Bugda kendi adını yazmış;
# katalogda yer tutucu olur, panel kullanıcının nick'iyle doldurur.
SAHIP = "{ad}"
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


def item_name(name):
    return re.sub(r"KOBugda", SAHIP, name, flags=re.I)


def set_name(key, names):
    """Parça adlarının ortak başı (ya da sonu): "Krowaz Warrior Boots" ... -> "Krowaz Warrior"."""
    if key in SET_ADI:
        return SET_ADI[key]
    words = [n.split() for n in names]
    def common(lists):
        out = []
        for t in zip(*lists):
            if any(x != t[0] for x in t):
                break
            out.append(t[0])
        return out
    pre, suf = common(words), common([w[::-1] for w in words])[::-1]
    if pre and len(pre) >= len(suf):
        return " ".join(pre)
    name = " ".join(suf)
    for lead in ("of the ", "of "):
        if name.startswith(lead):
            name = name[len(lead):]
    return name or names[0]


def set_family(it):
    flag = it.get("KrowazFlagId")
    if not flag:
        return None
    fam = (flag.bit_length() - 1) // 5
    return [SET_AILE[fam], flag >> (5 * fam)] if fam < len(SET_AILE) else None


def set_bonus_tables():
    path = os.path.join(SRC, "set_bonuslari.json")
    if not os.path.exists(path):
        return {}
    out = {}
    for name, rows in json.load(open(path, encoding="utf-8"))["tablolar"].items():
        out[name] = {mask: [r["bonus"].get(f, 0) for f in SET_ALAN] for mask, r in rows.items()
                     if any(r["bonus"].get(f, 0) for f in SET_ALAN)}
    return out


def trim(row):
    while len(row) > 1 and not row[-1]:
        row.pop()
    return row


def api_entries():
    """data/esyalar/kobugda/api/*.json içindeki API yanıtlarının kayıtları (liste, {data: [...]}, {sets: [...]} ya da
    {data: {data: [...]}})."""
    for path in sorted(glob.glob(os.path.join(SRC, "api", "*.json"))):
        d = json.load(open(path, encoding="utf-8"))
        while isinstance(d, dict):
            d = d.get("data", d.get("sets", []))
        yield from (x for x in d if isinstance(x, dict))


def is_api_set(x):
    return "bonuses" in x and "category" not in x


def api_items():
    out = {}
    for it in api_entries():
        key = it.get("legacyId") or it.get("id")
        if key is not None and not is_api_set(it):
            out[key] = it
    return out


def api_sets(setler, out_items, old_tables):
    """kobugda.com/api/sets kayıtlarını katalogdaki setlere bağlar: setin "bt" alanı sınıf -> {parça biti: bonus satırı}.
    Eşleştirme parça eşyasının legacyId'si, yoksa adıyla yapılır."""
    sets = [x for x in api_entries() if is_api_set(x)]
    if not sets:
        return
    by_id = {i: s for s in setler for i in s["p"]}
    by_name = {x["n"].lower(): by_id[x["id"]] for x in out_items if x["id"] in by_id}
    matched, unmatched, same, diff = 0, [], 0, []
    for a in sets:
        cls = API_SET_CLASS.get(str(a.get("characterClass", "")).upper())
        hits = []
        for p in a.get("parts") or []:
            item = p.get("item") or {}
            s = by_id.get(item.get("legacyId") or p.get("legacyId")) or by_name.get(str(item.get("name", "")).lower())
            if s:
                hits.append(s)
        if not cls or not hits:
            unmatched.append(a.get("name", "?"))
            continue
        s = max(hits, key=hits.count)
        table = {str(b.get("piecesRequired") or 0): [b.get(f) or 0 for f in API_SET_FIELDS] for b in a.get("bonuses") or []}
        table = {m: r for m, r in table.items() if m != "0" and any(r)}
        if not table:
            continue
        s.setdefault("bt", {}).setdefault(cls, {}).update(table)
        matched += 1
        old = s.get("a") and old_tables.get(f"{SET_PREFIX[cls]}_{s['a']}", {}).get("31")
        if old and "31" in table:
            if old == table["31"]:
                same += 1
            else:
                diff.append(f"{a.get('name')} ({cls})")
    print(f"API setleri: {len(sets)} set okundu, {matched} tanesi kataloğa bağlandı"
          + (f"; tam set bonusu eski tabloyla {same} sette aynı, {len(diff)} sette farklı" if same or diff else ""))
    if diff:
        print("  farklı:", ", ".join(diff[:12]) + (" …" if len(diff) > 12 else ""))
    if unmatched:
        print(f"  katalogda karşılığı olmayan {len(unmatched)} set:", ", ".join(unmatched[:12]) + (" …" if len(unmatched) > 12 else ""))


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
            "n": item_name(it["Name"]),
            "k": cat["Name"],
            "s": slots,
            "c": SINIF_DUZELTME.get(cat["Name"]) or [code for flag, code in CLASS_FLAGS if it[flag]],
            "i": it["ItemImageId"],
            "g": grade_of(it, cat["IsCospre"]),
            "set": it["SetIdentifiers"] or None,
            **({"ef": effects[it["Identifier"]]} if it["Identifier"] in effects else {}),
            **({"sb": sb} if (sb := set_family(it)) else {}),
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
            "id": key, "n": item_name(it.get("name", "?")), "k": cat_name, "s": slots,
            "c": SINIF_DUZELTME.get(cat_name) or [code for flag, code in API_CLASS if it.get(flag)],
            "i": None, "g": "cospre" if it.get("category") in API_COSPRE else "normal", "set": None,
            **({"ef": ef} if ef else {}),
        })
        if rows:
            stat_out[str(key)] = rows
        added += 1
    if api:
        print(f"API: {len(api)} eşya okundu, {filled} eşyanın derecesi tamamlandı, {added} yeni eşya eklendi")
    # Setler: aynı SetIdentifiers'ı taşıyan 5 parça (kask, zırh, pantolon, eldiven, bot)
    groups = {}
    for x in out_items:
        if x.get("set"):
            groups.setdefault(x["set"], []).append(x)
    setler = []
    for key, parts in groups.items():
        fams = {x["sb"][0] for x in parts if x.get("sb")}
        fam = fams.pop() if len(fams) == 1 else None
        setler.append({"k": key, "n": set_name(key, [x["n"] for x in parts]), "p": [x["id"] for x in parts],
                       **({"a": fam, "an": SET_AILE_ADI[fam]} if fam else {})})
    old_tables = set_bonus_tables()
    api_sets(setler, out_items, old_tables)
    set_src = ("kobugda.com setleri, eksikler eski KO Bugda" if any("bt" in x for x in setler)
               else "Eski KO Bugda tabloları · Draki Legion yok")
    json.dump({"kaynak": "KO Bugda (old.kobugda.com)", "alanlar": ["derece"] + STAT_FIELDS,
               "esyalar": out_items, "dereceler": stat_out, "setler": setler,
               "set_alanlari": SET_ALAN, "set_bonuslari": old_tables, "set_kaynak": set_src},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"{len(out_items)} eşya, {len(stat_out)} eşyada derece verisi, {len(setler)} set "
          f"({sum(1 for x in setler if 'a' in x or 'bt' in x)} tanesi bonuslu) -> {OUT}")
    if unknown:
        print("eşlenmeyen yuva tipleri:", unknown)


if __name__ == "__main__":
    main()
