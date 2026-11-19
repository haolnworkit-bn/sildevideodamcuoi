import type { StyleOverrides } from "../project";
import { hexToRgba } from "./helpers";
import type { FontLibrary, FontSet, Theme, VideoTemplate } from "./types";

/** Áp màu người dùng chọn lên bảng màu của mẫu */
export function resolveTheme(tpl: VideoTemplate, o: StyleOverrides): Theme {
  const t = { ...tpl.theme };
  if (o.headingColor) {
    t.heading = o.headingColor;
    t.names = o.headingColor;
  }
  if (o.textColor) t.body = o.textColor;
  if (o.accentColor) {
    t.accent = o.accentColor;
    t.line = hexToRgba(o.accentColor, 0.6);
  }
  return t;
}

/** Áp font người dùng chọn lên các vai trò font của mẫu */
export function resolveFonts(lib: FontLibrary, tpl: VideoTemplate, o: StyleOverrides): FontSet {
  const base = lib.base;
  const fonts: FontSet = {
    ...base,
    caps: tpl.capsFont === "display" ? base.display : base.serif,
  };
  const title = o.titleFont ? lib.byKey[o.titleFont] : undefined;
  if (title) {
    fonts.script = title;
    fonts.caps = title;
  }
  const body = o.bodyFont ? lib.byKey[o.bodyFont] : undefined;
  if (body) {
    fonts.serif = body;
    fonts.display = body;
  }
  return fonts;
}
