"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EventTypeId } from "@/lib/events";
import { FONT_LIB, ensureFontsLoaded } from "@/lib/fonts";
import { createDefaultProject, type Aspect, type ProjectData } from "@/lib/project";
import { renderFrame, timelineOf } from "@/lib/render/engine";
import type { Photo, VideoTemplate } from "@/lib/render/types";

/** Ảnh thu nhỏ của template theo tỉ lệ `aspect` (mặc định 16:9), vẽ trực tiếp bằng renderer. Rê chuột để chạy thử. */
export default function TemplateThumb({
  template,
  eventType,
  data,
  photos = [],
  at = 2.5,
  aspect = "16:9",
}: {
  template: VideoTemplate;
  eventType: EventTypeId;
  data?: ProjectData;
  photos?: Photo[];
  at?: number;
  aspect?: Aspect;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hover = useRef(false);
  // thumbnail luôn dùng bảng màu/font gốc của mẫu
  const d = useMemo<ProjectData>(() => {
    const base = data ?? createDefaultProject(template.id, eventType);
    return { ...base, aspect, style: {}, templateId: template.id };
  }, [data, template.id, eventType, aspect]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const input = { template, data: d, photos, fonts: FONT_LIB, watermark: null };
    const tl = timelineOf(input);
    let raf = 0;
    let t = at;
    let last = 0;
    let alive = true;
    const draw = () => renderFrame(ctx, t, input, tl);
    const loop = (now: number) => {
      if (!alive) return;
      if (hover.current) {
        t += last ? (now - last) / 1000 : 0;
        draw();
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    draw();
    ensureFontsLoaded().then(() => alive && draw());
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [template, d, photos, at]);

  return (
    <canvas
      ref={ref}
      width={aspect === "9:16" ? 270 : 480}
      height={aspect === "9:16" ? 480 : 270}
      className={`thumb-canvas ${aspect === "9:16" ? "portrait" : ""}`}
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
    />
  );
}
