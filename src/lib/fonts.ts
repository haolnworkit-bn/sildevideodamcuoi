import localFont from "next/font/local";
import type { FontLibrary } from "./render/types";
import { ensureAssetsLoaded } from "./render/assets";

/*
 * TẤT CẢ font được TỰ LƯU trong src/fonts/ (next/font/local), KHÔNG dùng next/font/google nữa:
 * từ 2026-11 Google Fonts trả file font ngẫu nhiên dạng "/l/font?kit=…" (không đuôi) → next/font/google lỗi build
 * ("Cannot read properties of null (reading '1')") cả máy local lẫn Vercel.
 * File lấy từ github.com/google/fonts (OFL, kèm OFL.txt), cắt Latin + tiếng Việt, woff2 — tạo lại bằng scripts/fetch-fonts.py.
 */

// Font mặc định (tải sẵn)
const greatVibes = localFont({
  src: [
    { path: "../fonts/greatvibes/GreatVibes-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-script",
  display: "swap",
});
const playfair = localFont({
  src: [
    { path: "../fonts/playfairdisplay/PlayfairDisplay-wght.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/playfairdisplay/PlayfairDisplay-Italic-wght.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});
const beVietnam = localFont({
  src: [
    { path: "../fonts/bevietnampro/BeVietnamPro-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/bevietnampro/BeVietnamPro-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/bevietnampro/BeVietnamPro-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/bevietnampro/BeVietnamPro-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/bevietnampro/BeVietnamPro-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});
const cormorant = localFont({
  src: [
    { path: "../fonts/cormorantgaramond/CormorantGaramond-wght.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorantgaramond/CormorantGaramond-Italic-wght.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

// Font tuỳ chọn (chỉ tải khi người dùng chọn)
const dancing = localFont({
  src: [
    { path: "../fonts/dancingscript/DancingScript-wght.woff2", weight: "400 700", style: "normal" },
  ],
  display: "swap",
  preload: false,
});
const alexBrush = localFont({
  src: [
    { path: "../fonts/alexbrush/AlexBrush-Regular.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
});
const allura = localFont({
  src: [
    { path: "../fonts/allura/Allura-Regular.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
});
const pinyon = localFont({
  src: [
    { path: "../fonts/pinyonscript/PinyonScript-Regular.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
});
const imperial = localFont({
  src: [
    { path: "../fonts/imperialscript/ImperialScript-Regular.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
});
const corinthia = localFont({
  src: [
    { path: "../fonts/corinthia/Corinthia-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/corinthia/Corinthia-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
});
const charm = localFont({
  src: [
    { path: "../fonts/charm/Charm-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/charm/Charm-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
});
const lora = localFont({
  src: [
    { path: "../fonts/lora/Lora-wght.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/lora/Lora-Italic-wght.woff2", weight: "400 700", style: "italic" },
  ],
  display: "swap",
  preload: false,
});
const notoSerif = localFont({
  src: [
    { path: "../fonts/notoserif/NotoSerif-wdth-wght.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/notoserif/NotoSerif-Italic-wdth-wght.woff2", weight: "400 700", style: "italic" },
  ],
  display: "swap",
  preload: false,
});
const ebGaramond = localFont({
  src: [
    { path: "../fonts/ebgaramond/EBGaramond-wght.woff2", weight: "400 800", style: "normal" },
    { path: "../fonts/ebgaramond/EBGaramond-Italic-wght.woff2", weight: "400 800", style: "italic" },
  ],
  display: "swap",
  preload: false,
});
const prata = localFont({
  src: [
    { path: "../fonts/prata/Prata-Regular.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
});
const montserrat = localFont({
  src: [
    { path: "../fonts/montserrat/Montserrat-wght.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/montserrat/Montserrat-Italic-wght.woff2", weight: "300 700", style: "italic" },
  ],
  display: "swap",
  preload: false,
});
const quicksand = localFont({
  src: [
    { path: "../fonts/quicksand/Quicksand-wght.woff2", weight: "300 700", style: "normal" },
  ],
  display: "swap",
  preload: false,
});

export const fontVariables = [greatVibes, playfair, beVietnam, cormorant].map((f) => f.variable).join(" ");

export interface FontOption {
  key: string;
  label: string;
  family: string;
}

const opt = (key: string, label: string, f: { style: { fontFamily: string } }): FontOption => ({
  key,
  label,
  family: f.style.fontFamily,
});

/** Font cho tiêu đề & tên (chữ viết tay + vài kiểu chữ in) */
export const TITLE_FONTS: FontOption[] = [
  opt("great-vibes", "Great Vibes", greatVibes),
  opt("dancing", "Dancing Script", dancing),
  opt("alex-brush", "Alex Brush", alexBrush),
  opt("allura", "Allura", allura),
  opt("pinyon", "Pinyon Script", pinyon),
  opt("imperial", "Imperial Script", imperial),
  opt("corinthia", "Corinthia", corinthia),
  opt("charm", "Charm", charm),
  opt("playfair", "Playfair Display", playfair),
  opt("cormorant", "Cormorant Garamond", cormorant),
  opt("prata", "Prata", prata),
];

/** Font cho lời nhắn, ngày tháng */
export const BODY_FONTS: FontOption[] = [
  opt("cormorant", "Cormorant Garamond", cormorant),
  opt("playfair", "Playfair Display", playfair),
  opt("lora", "Lora", lora),
  opt("noto-serif", "Noto Serif", notoSerif),
  opt("eb-garamond", "EB Garamond", ebGaramond),
  opt("prata", "Prata", prata),
  opt("be-vietnam", "Be Vietnam Pro", beVietnam),
  opt("montserrat", "Montserrat", montserrat),
  opt("quicksand", "Quicksand", quicksand),
];

const byKey: Record<string, string> = {};
for (const f of [...TITLE_FONTS, ...BODY_FONTS]) byKey[f.key] = f.family;

export const FONT_LIB: FontLibrary = {
  base: {
    script: greatVibes.style.fontFamily,
    display: playfair.style.fontFamily,
    sans: beVietnam.style.fontFamily,
    serif: cormorant.style.fontFamily,
  },
  byKey,
};

const SAMPLE = "Lễ Dạm Ngõ Ăn Hỏi ẮẰẲẴẶ đươ 0123";
const loaded = new Map<string, Promise<void>>();

function loadFamily(family: string, specs: string[]): Promise<void> {
  let p = loaded.get(family);
  if (!p) {
    p = Promise.all(specs.map((s) => document.fonts.load(`${s} 40px ${family}`, SAMPLE).catch(() => []))).then(() => undefined);
    loaded.set(family, p);
  }
  return p;
}

/**
 * Canvas không tự tải web font → phải tải trước khi vẽ, nếu không chữ sẽ ra font mặc định.
 * Truyền thêm key font người dùng chọn để tải theo nhu cầu.
 */
export function ensureFontsLoaded(extraKeys: Array<string | undefined> = []): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const b = FONT_LIB.base;
  const jobs = [
    loadFamily(b.script, ["400"]),
    loadFamily(b.display, ["500", "600", "italic 500"]),
    loadFamily(b.sans, ["400", "500", "600"]),
    loadFamily(b.serif, ["500", "600", "italic 500"]),
  ];
  for (const k of extraKeys) {
    const fam = k ? byKey[k] : undefined;
    if (fam) jobs.push(loadFamily(fam, ["400", "500", "600", "italic 500"]));
  }
  return Promise.all([...jobs, ensureAssetsLoaded()]).then(() => undefined);
}
