import type { ProjectData } from "../project";
import { drawAssetBackground, drawAssetFalling, drawAssetLayers } from "./layers";
import { drawWatermark, runScenes, scratchCanvas, setSpacing } from "./helpers";
import { albumScene, fitMessage, introScene, messageFont, messageScene, namesScene, type MessageFit } from "./scenes";
import type { LayoutProbe } from "./layout";
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
  /** Kiểm tra bố cục (dev): ghi khung bao chữ */
  probe?: LayoutProbe;
}

export function stageOf(data: ProjectData) {
  return STAGE[data.aspect] ?? STAGE["16:9"];
}

export function timelineOf(input: Pick<FrameInput, "data" | "photos">): Timeline {
  return computeTimeline(input.data, input.photos.length);
}

/** Trạng thái vẽ mặc định cho mỗi lớp (chữ, bóng, hoà trộn) */
function resetDrawState(ctx: CanvasRenderingContext2D) {
  setSpacing(ctx, 0);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowColor = "rgba(0,0,0,0)";
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Kiểm tra lời cảm ơn có vừa khung với font/cỡ của mẫu không — để editor cảnh báo TRƯỚC khi xuất.
 * Dùng đúng thuật toán của messageScene (fitMessage).
 */
export function checkMessageFit(input: Pick<FrameInput, "template" | "data" | "fonts">): MessageFit | null {
  if (typeof document === "undefined") return null;
  const fonts = resolveFonts(input.fonts, input.template, input.data.style);
  const ctx = scratchCanvas("msg-fit", 8, 8).getContext("2d")!;
  return fitMessage(ctx, input.data.message, messageFont({ fonts }, input.template), stageOf(input.data).H > stageOf(input.data).W);
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
    probe: input.probe,
  };
  if (input.probe) input.probe.scale = scale;
  const sc = (name: string) => {
    if (input.probe) input.probe.scene = name;
    resetDrawState(ctx);
  };

  // Mỗi lớp vẽ trong save/restore riêng và bắt đầu với trạng thái chữ sạch (không rò letterSpacing/align…)
  const layer = (fn: () => void) => {
    ctx.save();
    resetDrawState(ctx);
    fn();
    ctx.restore();
  };

  layer(() => tpl.background(rc));
  // Ảnh trang trí khai báo trong src/config/template-assets.ts
  layer(() => drawAssetBackground(rc, tpl.id));
  // Viền khung / chữ chìm của mẫu: nằm trên ảnh nền nhưng DƯỚI các ảnh trang trí (không đè lên vật thể)
  if (tpl.backdrop) layer(() => tpl.backdrop!(rc));
  layer(() => drawAssetLayers(rc, tpl.id, "back"));

  // runScenes đã bọc save/restore cho từng cảnh; chỉ cần đặt lại trạng thái chữ trước khi vẽ
  runScenes(rc, {
    intro: (lt) => (sc("intro"), introScene(rc, lt, tpl)),
    message: (lt) => (sc("message"), messageScene(rc, lt, tpl)),
    album: (lt, s) => (sc("album"), albumScene(rc, lt, s, tpl)),
    names: (lt) => (sc("names"), namesScene(rc, lt, tpl)),
  });

  layer(() => {
    drawAssetLayers(rc, tpl.id, "front");
    drawAssetFalling(rc, tpl.id);
  });
  if (tpl.foreground) layer(() => tpl.foreground!(rc));
  if (input.watermark) drawWatermark(ctx, W, H, input.watermark, rc.fonts.sans);
  ctx.restore();
}
