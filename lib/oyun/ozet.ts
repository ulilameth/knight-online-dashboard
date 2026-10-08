// Kayıtlı bir build'in ekipman özeti (Üyeler › Ekipman sütunu ve penceresi). Sunucuda hesaplanır, istemciye düz veri gider.
import type { Build, Irk } from "@/lib/types";
import { EK_YOK, STATLAR, hesapla } from "./hesap";
import { EKIPMAN_BOLUMLERI, type EsyaDerecesi, type Katalog, YUVA_ADLARI, YUVA_TURLERI, type YuvaTuru, esyaAdi, ozetMetni } from "./katalog";

export interface YuvaOzeti {
  yuva: string;
  yuvaTuru: YuvaTuru;
  esyaId: number;
  ad: string;
  gorsel: number | null;
  derece: EsyaDerecesi;
  arti: number;
  ozet: string;
}

export interface EkipmanOzeti {
  ap: number;
  can: number;
  mana: number;
  savunma: number;
  /** "STR 120 · HP 90 · DEX 345 · INT 50 · MP 50" (eşya ve set dahil) */
  statSatiri: string;
  skiller: number[];
  /** Ana silah (tablo hücresindeki ikon) */
  silah: { gorsel: number | null; derece: EsyaDerecesi } | null;
  /** "Mythril 5/5" ya da "6 eşya" */
  kisa: string;
  bolumler: { baslik: string; setNotu: string | null; yuvalar: YuvaOzeti[] }[];
  level: number;
  reb: number;
  irkAdi: string;
  kaydedildi: string;
}

export function ekipmanOzeti(b: Build, irk: Irk, kat: Katalog, sahip: string): EkipmanOzeti {
  const h = hesapla(b, irk.statlar, kat, EK_YOK);
  const yuvaOf = (i: number): YuvaOzeti | null => {
    const g = b.ekipman[String(i)], e = g && kat.esyalar.get(g.itemId);
    return e ? { yuva: YUVA_ADLARI[i], yuvaTuru: YUVA_TURLERI[i], esyaId: e.id, ad: esyaAdi(e, sahip), gorsel: e.gorsel, derece: e.derece, arti: g.arti, ozet: ozetMetni(kat, e, g.arti) } : null;
  };
  const setler = h.G.setler.filter((s) => s.set);
  const setNotu = setler.map((s) => `${s.set!.ad} ${s.parca}/5${s.satir ? " · bonus aktif" : ""}`).join(" · ") || null;
  const silah = yuvaOf(0);
  return {
    ap: h.ap, can: h.can, mana: h.mana, savunma: h.savunma,
    statSatiri: STATLAR.map(([s, ad]) => `${ad} ${h.toplam[s]}`).join(" · "),
    skiller: b.skiller,
    silah: silah ? { gorsel: silah.gorsel, derece: silah.derece } : null,
    kisa: setler[0] ? `${setler[0].set!.ad} ${setler[0].parca}/5` : `${h.G.adet} eşya`,
    bolumler: EKIPMAN_BOLUMLERI.map(([baslik, , yuvalar]) => ({
      baslik, setNotu: baslik === "Zırh seti" ? setNotu : null,
      yuvalar: yuvalar.map(yuvaOf).filter((y): y is YuvaOzeti => y !== null),
    })).filter((b) => b.yuvalar.length),
    level: b.level, reb: b.reb, irkAdi: irk.ad, kaydedildi: b.updatedAt,
  };
}
