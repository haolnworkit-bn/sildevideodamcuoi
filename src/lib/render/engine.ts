import type { ProjectData } from "../project";
import { drawAssetBackground, drawAssetFalling, drawAssetLayers } from "./layers";
import { drawWatermark, runScenes } from "./helpers";
import { albumScene, introScene, messageScene, namesScene } from "./scenes";
import { resolveFonts, resolveTheme } from "./theme";
import { computeTimeline } from "./timeline";
import { STAGE, type FontLibrary, type Photo, type RenderContext, type Timeline, type VideoTemplate } from "./types";

export interface FrameInput {
  template: VideoTemplate;
  data: ProjectData;
  photos: Photo[];
  fonts: FontLibrary;
  /** null = không watermark */
  watermark: string | null;
}

export function stageOf(data: ProjectData) {
  return STAGE[data.aspect] ?? STAGE["16:9"];
}

export function timelineOf(input: Pick<FrameInput, "data" | "photos">): Timeline {
  return computeTimeline(input.data, input.photos.length);
}

/**
 * Vẽ một khung hình vào canvas có kích thước bất kỳ (tự scale từ sân khấu logic).
 * Dùng chung cho preview, thumbnail, trình chiếu và xuất video → điều bạn thấy là điều bạn nhận.
 */
export function renderFrame(ctx: CanvasRenderingContext2D, t: number, input: FrameInput, timeline?: Timeline) {
  const { template: tpl, data, photos } = input;
  const { W, H } = stageOf(data);
  const tl = timeline ?? timelineOf(input);
  const D = tl.duration;
  const scale = ctx.canvas.width / W;

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);

  const rc: RenderContext = {
    ctx,
    W,
    H,
    portrait: H > W,
    t: ((t % D) + D) % D,
    D,
    timeline: tl,
    data,
    photos,
    photo: photos[0] ?? null,
    fonts: resolveFonts(input.fonts, tpl, data.style),
    theme: resolveTheme(tpl, data.style),
    fx: data.fx,
  };

  ctx.save();
  tpl.background(rc);
  ctx.restore();

  // Ảnh trang trí khai báo trong src/config/template-assets.ts
  ctx.save();
  drawAssetBackground(rc, tpl.id);
  ctx.restore();

  // Viền khung / chữ chìm của mẫu: nằm trên ảnh nền nhưng DƯỚI các ảnh trang trí (không đè lên vật thể)
  if (tpl.backdrop) {
    ctx.save();
    tpl.backdrop(rc);
    ctx.restore();
  }

  ctx.save();
  drawAssetLayers(rc, tpl.id, "back");
  ctx.restore();

  runScenes(rc, {
    intro: (lt) => introScene(rc, lt, tpl),
    message: (lt) => messageScene(rc, lt, tpl),
    album: (lt, s) => albumScene(rc, lt, s, tpl),
    names: (lt) => namesScene(rc, lt, tpl),
  });

  ctx.save();
  drawAssetLayers(rc, tpl.id, "front");
  drawAssetFalling(rc, tpl.id);
  ctx.restore();

  if (tpl.foreground) {
    ctx.save();
    tpl.foreground(rc);
    ctx.restore();
  }
  if (input.watermark) drawWatermark(ctx, W, H, input.watermark, rc.fonts.sans);
  ctx.restore();
}
