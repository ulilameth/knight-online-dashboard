// Level barları: N. eleman, N'den N+1'e geçmek için gereken EXP (1-83).
// Tablo A: KO Rehberi EXP tablosu (29.01.2024) ve knightonlinerehber.net 1-83 rehberi (2026) ile aynı.
// NTTGame resmi tablo yayımlamıyor; bir emülatör tablosu her levelde tam 4 katını veriyor. Açılış günü oyunda
// bir EXP barı okunarak doğrulanmalı (ör. 35. levelde A 808.207, emülatör 3.232.828 der). Bkz. raporun "EXP tablosu" bölümü.

export const EXP_TABLOSU_KAYNAK = {
  ad: "Tablo A (KO Rehberi, KO Rehber 2026)",
  url: "https://korehberi.com/knight-online/rehberler/exp-tablosu",
  dogrulandi: false,
  /** Oyunda okunacak kontrol değeri: 35. level barı */
  kontrol: { level: 35, a: 808_207, emulator: 3_232_828 },
} as const;

/** BARLAR[level - 1] = level → level + 1 */
const BARLAR: readonly number[] = [
  50, 100, 190, 342, 581, 929, 1_393, 1_950, 2_535, 5_070, // 1-10
  6_084, 7_300, 8_760, 10_512, 12_612, 15_136, 18_163, 21_795, 26_154, 52_308, // 11-20
  60_154, 69_177, 79_553, 91_485, 105_207, 120_988, 139_136, 160_006, 184_006, 368_012, // 21-30
  404_813, 445_294, 489_823, 538_805, 808_207, 889_027, 977_929, 1_075_721, 1_183_293, 2_366_586, // 31-40
  2_603_244, 2_863_568, 3_149_924, 3_464_916, 5_197_374, 5_717_111, 6_288_822, 6_917_704, 7_609_474, 15_218_948, // 41-50
  16_740_842, 18_414_926, 20_256_418, 22_282_059, 33_423_088, 36_765_396, 40_441_935, 44_486_128, 48_934_740, 73_402_110, // 51-60
  132_123_798, 145_336_177, 159_869_794, 175_856_773, 193_442_450, 212_786_695, 234_065_364, 257_471_900, 283_219_090, 311_540_999, // 61-70
  373_849_198, 453_852_927, 550_977_453, 668_886_628, 812_028_367, 985_802_438, 1_196_764_159, 1_452_871_690, 1_763_786_231, 2_141_236_485, // 71-80
  4_317_589_248, 6_130_976_733, 8_705_986_960, // 81-83
];

export const EN_YUKSEK_LEVEL = BARLAR.length;

/** level → level + 1 için gereken EXP */
export function bar(level: number): number {
  const l = Math.max(1, Math.min(EN_YUKSEK_LEVEL, Math.floor(level)));
  return BARLAR[l - 1];
}

/** 1. levelden `level`in başına kadar toplam EXP */
export function birikmis(level: number): number {
  let t = 0;
  for (let l = 1; l < Math.min(level, EN_YUKSEK_LEVEL + 1); l++) t += BARLAR[l - 1];
  return t;
}

/** a levelinin başından b levelinin başına kadar gereken EXP */
export const aradaki = (a: number, b: number) => birikmis(b) - birikmis(a);

/** Ödül, verilen leveldeki barın yüzde kaçı */
export const barYuzdesi = (exp: number, level: number) => (exp / bar(level)) * 100;
