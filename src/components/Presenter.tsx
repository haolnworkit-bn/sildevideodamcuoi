"use client";

import { useEffect, useRef, useState } from "react";
import { FONT_LIB, ensureFontsLoaded } from "@/lib/fonts";
import { renderFrame, stageOf, timelineOf, type FrameInput } from "@/lib/render/engine";

type Props = Omit<FrameInput, "fonts"> & { musicUrl: string | null; volume: number; onClose: () => void };

/**
 * Trình chiếu toàn màn hình: cắm laptop vào TV/máy chiếu qua HDMI là dùng được ngay,
 * không cần xuất file. Giữ màn hình luôn sáng (Wake Lock), ẩn con trỏ, phát nhạc nền lặp lại.
 */
export default function Presenter({ onClose, musicUrl, volume, ...input }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [idle, setIdle] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { W, H } = stageOf(input.data);

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

    if (musicUrl) {
      const a = new Audio(musicUrl);
      a.loop = true;
      a.volume = volume;
      audioRef.current = a;
      a.play().catch(() => setNeedTap(true));
    }

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

    ensureFontsLoaded([input.data.style.titleFont, input.data.style.bodyFont]);
    const t0 = performance.now();
    const loop = (now: number) => {
      if (!alive) return;
      const c = canvasRef.current;
      if (c) {
        const p = inputRef.current;
        const st = stageOf(p.data);
        const dpr = window.devicePixelRatio || 1;
        const w = Math.min(st.W, Math.round(c.clientWidth * dpr));
        const h = Math.round((w * st.H) / st.W);
        if (c.width !== w || c.height !== h) {
          c.width = w;
          c.height = h;
        }
        const ctx = c.getContext("2d");
        if (ctx) renderFrame(ctx, (now - t0) / 1000, { ...p, fonts: FONT_LIB }, timelineOf(p));
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
      audioRef.current?.pause();
      wake?.release().catch(() => {});
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className={`presenter ${idle ? "idle" : ""}`} onDoubleClick={onClose}>
      <canvas
        ref={canvasRef}
        className="presenter-canvas"
        style={{ width: `min(100vw, calc(100vh * ${W} / ${H}))`, aspectRatio: `${W} / ${H}` }}
      />
      <div className="presenter-hint">
        Đang trình chiếu · Nhấn <kbd>Esc</kbd> hoặc nhấp đúp để thoát
        {needTap && (
          <button
            className="btn ghost"
            onClick={() => {
              audioRef.current?.play();
              setNeedTap(false);
            }}
          >
            ♪ Bật nhạc
          </button>
        )}
        <button className="btn ghost" onClick={onClose}>
          Thoát
        </button>
      </div>
    </div>
  );
}
