// Chạy: npm run test:lunar
import { solarToLunar, canChiYear } from "../src/lib/lunar.ts";

const cases: Array<[string, [number, number, number], string]> = [
  ["Tết Bính Ngọ", [17, 2, 2026], "1/1 Bính Ngọ"],
  ["Tết Ất Tỵ", [29, 1, 2025], "1/1 Ất Tỵ"],
  ["Tết Giáp Thìn", [10, 2, 2024], "1/1 Giáp Thìn"],
  ["Rằm trung thu 2025", [6, 10, 2025], "15/8 Ất Tỵ"],
  ["Mùng 1 tháng 6 nhuận 2025", [25, 7, 2025], "1/6n Ất Tỵ"],
  ["Giao thừa 2026", [16, 2, 2026], "29/12 Ất Tỵ"],
];

let failed = 0;
for (const [label, [d, m, y], expected] of cases) {
  const l = solarToLunar(d, m, y);
  const got = `${l.day}/${l.month}${l.leap ? "n" : ""} ${canChiYear(l.year)}`;
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: ${d}/${m}/${y} -> ${got} (mong đợi ${expected})`);
}
process.exit(failed ? 1 : 0);
