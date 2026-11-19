import { Be_Vietnam_Pro, Cormorant_Garamond, Great_Vibes, Playfair_Display } from "next/font/google";
import type { FontSet } from "./render/types";

const script = Great_Vibes({ weight: "400", subsets: ["latin", "vietnamese"], variable: "--font-script" });
const display = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
});
const sans = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});
const serif = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
});

export const fontVariables = [script, display, sans, serif].map((f) => f.variable).join(" ");

export const FONT_SET: FontSet = {
  script: script.style.fontFamily,
  display: display.style.fontFamily,
  sans: sans.style.fontFamily,
  serif: serif.style.fontFamily,
};

let fontsReady: Promise<void> | null = null;

/** Canvas không tự tải web font → phải tải trước khi vẽ, nếu không chữ sẽ ra font mặc định. */
export function ensureFontsLoaded(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (!fontsReady) {
    const sample = "Lễ Dạm Ngõ Ăn Hỏi ẮẰẲẴẶ đươ 0123";
    const specs = [
      `400 40px ${FONT_SET.script}`,
      `600 40px ${FONT_SET.display}`,
      `italic 500 40px ${FONT_SET.display}`,
      `400 40px ${FONT_SET.sans}`,
      `500 40px ${FONT_SET.sans}`,
      `600 40px ${FONT_SET.sans}`,
      `500 40px ${FONT_SET.serif}`,
      `600 40px ${FONT_SET.serif}`,
      `italic 500 40px ${FONT_SET.serif}`,
    ];
    fontsReady = Promise.all(specs.map((s) => document.fonts.load(s, sample).catch(() => []))).then(() => undefined);
  }
  return fontsReady;
}
