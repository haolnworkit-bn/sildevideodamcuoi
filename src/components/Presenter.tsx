"use client";

import { useEffect, useRef, useState } from "react";
import { FONT_SET, ensureFontsLoaded } from "@/lib/fonts";
import { renderFrame, type FrameInput } from "@/lib/render/engine";

type Props = Omit<FrameInput, "fonts"> & { onClose: () => void };

/**
 * Trình chiếu toàn màn hình: cắm laptop vào TV/máy chiếu qua HDMI là dùng được ngay,
 * không cần xuất file. Giữ màn hình luôn sáng (Wake Lock) và ẩn con trỏ chuột.
 */
export default function Presenter({ onClose, ...input }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    let wake: { release: () => Promise<void> } | null = null;
    let alive = true;
    let raf = 0;
    let idleTimer = 0;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    wrap?.requestFullscreen?.().catch(() => {
      /* trình duyệt không cho fullscreen → vẫn chiếu trong cửa sổ */
    });

    const requestWake = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
        wake = (await nav.wakeLock?.request("screen")) ?? null;
      } catch {
        /* không hỗ trợ */
      }
    };
    requestWake();
    const onVis = () => document.visibilityState === "visible" && requestWake();
    document.addEventListener("visibilitychange", onVis);

    const onFs = () => {
      if (!document.fullscreenElement) closeRef.current();
    };
    document.addEventListener("fullscreenchange", onFs);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);

    const poke = () => {
      setIdle(false);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setIdle(true), 2500);
    };
    poke();
    window.addEventListener("mousemove", poke);

    ensureFontsLoaded();
    const t0 = performance.now();
    const loop = (now: number) => {
      if (!alive) return;
      const c = canvasRef.current;
      if (c) {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.min(1920, Math.round(c.clientWidth * dpr));
        const h = Math.round((w * 9) / 16);
        if (c.width !== w || c.height !== h) {
          c.width = w;
          c.height = h;
        }
        const ctx = c.getContext("2d");
        if (ctx) renderFrame(ctx, (now - t0) / 1000, { ...inputRef.current, fonts: FONT_SET });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", poke);
      wake?.release().catch(() => {});
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  return (
    <div ref={wrapRef} className={`presenter ${idle ? "idle" : ""}`} onDoubleClick={onClose}>
      <canvas ref={canvasRef} className="presenter-canvas" />
      <div className="presenter-hint">
        Đang trình chiếu · Nhấn <kbd>Esc</kbd> hoặc nhấp đúp để thoát
        <button className="btn ghost" onClick={onClose}>
          Thoát
        </button>
      </div>
    </div>
  );
}
