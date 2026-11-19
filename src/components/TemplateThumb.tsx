"use client";

import { useEffect, useRef } from "react";
import { FONT_SET, ensureFontsLoaded } from "@/lib/fonts";
import type { EventTypeId } from "@/lib/events";
import { createDefaultProject, type ProjectData } from "@/lib/project";
import { renderFrame } from "@/lib/render/engine";
import type { PhotoSource, VideoTemplate } from "@/lib/render/types";

/** Ảnh thu nhỏ của template, vẽ trực tiếp bằng renderer (không cần file ảnh tĩnh). Rê chuột để chạy thử. */
export default function TemplateThumb({
  template,
  eventType,
  data,
  photo = null,
  at = 16.5,
}: {
  template: VideoTemplate;
  eventType: EventTypeId;
  data?: ProjectData;
  photo?: PhotoSource | null;
  at?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hover = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const d = data ?? createDefaultProject(template.id, eventType);
    const input = { template, data: d, photo, fonts: FONT_SET, watermark: null };
    let raf = 0;
    let t = at;
    let last = 0;
    let alive = true;
    const draw = () => renderFrame(ctx, t, input);
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
  }, [template, eventType, data, photo, at]);

  return (
    <canvas
      ref={ref}
      width={640}
      height={360}
      className="thumb-canvas"
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
    />
  );
}
