import {
  TEMPLATE_ASSETS,
  type Anchor,
  type FallingSpec,
  type ImageLayer,
  type TemplateAssets,
} from "@/config/template-assets";
import { getAsset, registerAsset } from "./assets";
import { TAU, makeLoopParticles, particleAt, particlesFor } from "./helpers";
import type { RenderContext } from "./types";

/** Bắt đầu tải mọi ảnh khai báo cho một mẫu (gọi lúc khởi động, idempotent) */
export function preloadTemplateAssets(id: string): void {
  const a = TEMPLATE_ASSETS[id];
  if (!a) return;
  const urls = [
    a.background?.landscape,
    a.background?.portrait,
    ...(a.back ?? []).map((l) => l.src),
    ...(a.front ?? []).map((l) => l.src),
    ...(a.falling ?? []).map((f) => f.src),
    ...(a.preload ?? []),
  ];
  for (const u of urls) if (u) registerAsset(u);
}

const ANCHOR: Record<Anchor, [number, number]> = {
  tl: [0, 0],
  tc: [0.5, 0],
  tr: [1, 0],
  cl: [0, 0.5],
  c: [0.5, 0.5],
  cr: [1, 0.5],
  bl: [0, 1],
  bc: [0.5, 1],
  br: [1, 1],
};

/** Ảnh nền phủ kín (cover). Trả về true nếu đã vẽ (để mẫu biết nền code đã bị phủ) */
export function drawAssetBackground(rc: RenderContext, id: string): boolean {
  const spec = TEMPLATE_ASSETS[id]?.background;
  if (!spec) return false;
  const url = rc.portrait ? spec.portrait : spec.landscape;
  const img = url ? getAsset(url) : null;
  if (!img) return false;
  const { ctx, W, H } = rc;
  const u = rc.t / rc.D;
  const zoom = 1 + (spec.zoom ?? 0) * (0.5 + 0.5 * Math.sin(TAU * u));
  const k = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * k;
  const h = img.height * k;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  return true;
}

function resolveLayer(l: ImageLayer, portrait: boolean): ImageLayer | null {
  if (l.only && l.only !== (portrait ? "portrait" : "landscape")) return null;
  if (portrait && l.portrait) {
    if (l.portrait.hide) return null;
    const { hide: _hide, ...over } = l.portrait;
    return { ...l, ...over };
  }
  return l;
}

export function drawAssetLayers(rc: RenderContext, id: string, slot: "back" | "front"): void {
  const layers = TEMPLATE_ASSETS[id]?.[slot];
  if (!layers?.length) return;
  const { ctx, W, H } = rc;
  const u = rc.t / rc.D;
  for (const raw of layers) {
    const l = resolveLayer(raw, rc.portrait);
    if (!l) continue;
    const img = getAsset(l.src);
    if (!img) continue;
    let w: number;
    let h: number;
    if (l.width !== undefined) {
      w = l.width * W;
      h = (w * img.height) / img.width;
    } else {
      h = (l.height ?? img.height / H) * H;
      w = (h * img.width) / img.height;
    }
    const m = l.motion ?? {};
    const f = TAU * Math.max(1, Math.round(m.cycles ?? 2)) * u + (m.phase ?? 0);
    const sway = (m.sway ?? 0) * Math.sin(f);
    const bobY = (m.bob ?? 0) * H * Math.sin(f + 1.3);
    const driftX = (m.driftX ?? 0) * W * Math.sin(f + 0.7);
    const breathe = 1 + (m.breathe ?? 0) * Math.sin(f + 2.1);
    const [ax, ay] = ANCHOR[l.anchor];
    ctx.save();
    ctx.translate(l.x * W + driftX, l.y * H + bobY);
    ctx.rotate((l.rotate ?? 0) + sway);
    ctx.scale(l.flip ? -breathe : breathe, breathe);
    ctx.globalAlpha *= l.alpha ?? 1;
    ctx.drawImage(img, -ax * w, -ay * h, w, h);
    ctx.restore();
  }
}

const fallingCache = new Map<string, ReturnType<typeof makeLoopParticles>>();

function particlesOf(id: string, i: number, f: FallingSpec) {
  const key = `${id}#${i}`;
  let arr = fallingCache.get(key);
  if (!arr) {
    // kích thước hạt tính theo px chuẩn 1080 (cạnh ngắn); khi vẽ nhân lại theo cạnh ngắn thực tế
    arr = makeLoopParticles(f.count, f.seed ?? 101 + i, {
      minSize: f.size[0] * 1080,
      maxSize: f.size[1] * 1080,
      maxLoops: f.loops ?? 1,
      drift: f.drift ?? 100,
    });
    fallingCache.set(key, arr);
  }
  return arr;
}

export function drawAssetFalling(rc: RenderContext, id: string): void {
  const list: TemplateAssets["falling"] = TEMPLATE_ASSETS[id]?.falling;
  if (!list?.length) return;
  const { ctx, W, H } = rc;
  const u = rc.t / rc.D;
  const unit = Math.min(W, H) / 1080;
  list.forEach((f, i) => {
    const img = getAsset(f.src);
    if (!img) return;
    for (const p of particlesFor(rc, particlesOf(id, i, f))) {
      const q = particleAt(p, u, W, H, 60, 1);
      const w = p.size * unit;
      const h = (w * img.height) / img.width;
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.scale(0.45 + 0.55 * Math.abs(q.flip), 1);
      ctx.globalAlpha *= 0.92;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  });
}
