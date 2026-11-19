import {
  Alex_Brush,
  Allura,
  Be_Vietnam_Pro,
  Charm,
  Corinthia,
  Cormorant_Garamond,
  Dancing_Script,
  EB_Garamond,
  Great_Vibes,
  Imperial_Script,
  Lora,
  Montserrat,
  Noto_Serif,
  Pinyon_Script,
  Playfair_Display,
  Prata,
  Quicksand,
} from "next/font/google";
import type { FontLibrary } from "./render/types";

// Font mặc định (tải sẵn)
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin", "vietnamese"], variable: "--font-script" });
const playfair = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
});
const beVietnam = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});
const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
});

// Font tuỳ chọn (chỉ tải khi người dùng chọn)
const dancing = Dancing_Script({ weight: ["400", "600"], subsets: ["latin", "vietnamese"], preload: false });
const alexBrush = Alex_Brush({ weight: "400", subsets: ["latin", "vietnamese"], preload: false });
const allura = Allura({ weight: "400", subsets: ["latin", "vietnamese"], preload: false });
const pinyon = Pinyon_Script({ weight: "400", subsets: ["latin", "vietnamese"], preload: false });
const imperial = Imperial_Script({ weight: "400", subsets: ["latin", "vietnamese"], preload: false });
const corinthia = Corinthia({ weight: ["400", "700"], subsets: ["latin", "vietnamese"], preload: false });
const charm = Charm({ weight: ["400", "700"], subsets: ["latin", "vietnamese"], preload: false });
const lora = Lora({ weight: ["400", "500", "600"], style: ["normal", "italic"], subsets: ["latin", "vietnamese"], preload: false });
const notoSerif = Noto_Serif({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  preload: false,
});
const ebGaramond = EB_Garamond({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  preload: false,
});
const prata = Prata({ weight: "400", subsets: ["latin", "vietnamese"], preload: false });
const montserrat = Montserrat({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  preload: false,
});
const quicksand = Quicksand({ weight: ["400", "500", "600"], subsets: ["latin", "vietnamese"], preload: false });

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
  return Promise.all(jobs).then(() => undefined);
}
