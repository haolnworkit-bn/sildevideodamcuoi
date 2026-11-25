"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FONT_LIB, ensureFontsLoaded } from "@/lib/fonts";
import { renderFrame, stageOf, timelineOf, type FrameInput } from "@/lib/render/engine";

type Props = Omit<FrameInput, "fonts"> & { musicUrl: string | null; volume: number; onClose: () => void };

/** Khung hình/giây khi chiếu — bằng đúng file MP4 xuất ra, và đỡ nóng máy khi chiếu hàng giờ */
const FPS = 30;
/** Chờ font + ảnh trang trí tối đa chừng này rồi chiếu luôn (mạng chậm vẫn không treo) */
const LOAD_TIMEOUT_MS = 6000;

type Phase = "choose" | "playing";

/** Window Management API (Chrome/Edge): chọn màn hình để bật toàn màn hình */
type ScreenLike = { isPrimary?: boolean; width: number; height: number; label?: string };
type ScreenDetails = { screens: ScreenLike[]; currentScreen: ScreenLike };
type WinMgmt = Window & { getScreenDetails?: () => Promise<ScreenDetails> };
type ScreenExt = Screen & { isExtended?: boolean };

/**
 * Trình chiếu toàn màn hình: cắm laptop vào TV/máy chiếu qua HDMI là dùng được ngay,
 * không cần xuất file. Giữ màn hình luôn sáng (Wake Lock), ẩn con trỏ, phát nhạc nền lặp lại.
 * - Laptop đang "mở rộng màn hình" sang TV → hỏi chiếu lên màn hình nào (mặc định: màn hình kia).
 * - Chờ font + ảnh tải xong mới bắt đầu (không nháy chữ/nền ở giây đầu).
 * - Vẽ 30 hình/giây, thời điểm khớp khung hình của MP4.
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
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" && (window.screen as ScreenExt).isExtended ? "choose" : "playing",
  );
  const [fsError, setFsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { W, H } = stageOf(input.data);

  /** Bật toàn màn hình, có thể trên màn hình khác (TV). Lỗi → vẫn chiếu trong cửa sổ. */
  const goFullscreen = useCallback(async (target: "other" | "this") => {
    const wrap = wrapRef.current;
    if (!wrap?.requestFullscreen) return;
    let screen: ScreenLike | undefined;
    if (target === "other") {
      try {
        const d = await (window as WinMgmt).getScreenDetails?.();
        if (d) {
          const others = d.screens.filter((s) => s !== d.currentScreen);
          // ưu tiên màn hình không phải màn chính, rồi màn lớn nhất
          others.sort((a, b) => Number(!!a.isPrimary) - Number(!!b.isPrimary) || b.width * b.height - a.width * a.height);
          screen = others[0];
        }
      } catch {
        /* người dùng từ chối quyền "quản lý cửa sổ" → bật trên màn hình hiện tại */
      }
    }
    try {
      await wrap.requestFullscreen(screen ? ({ screen } as FullscreenOptions) : undefined);
      setFsError(null);
      setPhase("playing");
    } catch {
      if (target === "other") {
        // hộp thoại cấp quyền làm mất lượt bấm → bấm lại lần nữa là được (quyền đã có)
        setFsError("Trình duyệt chưa cho bật toàn màn hình. Bấm lại nút một lần nữa.");
      } else {
        setPhase("playing");
      }
    }
  }, []);

  // ---- vòng đời chung: khoá cuộn, Wake Lock, phím tắt, ẩn chuột, tải font/ảnh ----
  useEffect(() => {
    let wake: { release: () => Promise<void> } | null = null;
    let idleTimer = 0;
    let alive = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // chỉ có 1 màn hình → bật toàn màn hình ngay (vẫn trong lượt bấm nút Trình chiếu)
    if (!(window.screen as ScreenExt).isExtended) {
      wrapRef.current?.requestFullscreen?.().catch(() => {
        /* trình duyệt không cho fullscreen → vẫn chiếu trong cửa sổ */
      });
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
    let wasFull = false;
    const onFs = () => {
      if (document.fullscreenElement) wasFull = true;
      else if (wasFull) closeRef.current();
    };
    document.addEventListener("fullscreenchange", onFs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "m" || e.key === "M") {
        const a = audioRef.current;
        if (a) a.muted = !a.muted;
      }
    };
    window.addEventListener("keydown", onKey);
    const poke = () => {
      setIdle(false);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setIdle(true), 2500);
    };
    poke();
    window.addEventListener("mousemove", poke);

    const p = inputRef.current;
    Promise.race([
      ensureFontsLoaded([p.data.style.titleFont, p.data.style.bodyFont]),
      new Promise((r) => setTimeout(r, LOAD_TIMEOUT_MS)),
    ]).then(() => alive && setReady(true));

    return () => {
      alive = false;
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(idleTimer);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", poke);
      wake?.release().catch(() => {});
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  // ---- chiếu: chỉ chạy khi đã chọn màn hình và font/ảnh sẵn sàng ----
  const playing = phase === "playing" && ready;
  useEffect(() => {
    if (!playing) return;
    let alive = true;
    let raf = 0;
    let lastFrame = -1;

    if (musicUrl) {
      const a = new Audio(musicUrl);
      a.loop = true;
      a.volume = volume;
      audioRef.current = a;
      a.play().catch(() => setNeedTap(true));
    }

    const t0 = performance.now();
    const loop = (now: number) => {
      if (!alive) return;
      const frame = Math.floor(((now - t0) / 1000) * FPS);
      const c = canvasRef.current;
      if (c && frame !== lastFrame) {
        lastFrame = frame;
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
        if (ctx) renderFrame(ctx, frame / FPS, { ...p, fonts: FONT_LIB }, timelineOf(p));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      audioRef.current?.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  return (
    <div ref={wrapRef} className={`presenter ${idle && playing ? "idle" : ""}`} onDoubleClick={playing ? onClose : undefined}>
      <canvas
        ref={canvasRef}
        className="presenter-canvas"
        style={{ width: `min(100vw, calc(100vh * ${W} / ${H}))`, aspectRatio: `${W} / ${H}` }}
      />

      {phase === "choose" && (
        <div className="presenter-choose" role="dialog" aria-label="Chọn màn hình trình chiếu">
          <h2>Máy đang nối với màn hình thứ hai</h2>
          <p>Chọn nơi chiếu video. Lần đầu trình duyệt có thể hỏi quyền &quot;quản lý cửa sổ&quot;, hãy bấm Cho phép.</p>
          <div className="presenter-choose-actions">
            <button className="btn primary" onClick={() => goFullscreen("other")}>
              Chiếu lên TV / máy chiếu
            </button>
            <button className="btn ghost" onClick={() => goFullscreen("this")}>
              Chiếu trên màn hình này
            </button>
            <button className="btn ghost" onClick={onClose}>
              Huỷ
            </button>
          </div>
          {fsError && <p className="presenter-error">{fsError}</p>}
        </div>
      )}

      {phase === "playing" && !ready && <div className="presenter-loading">Đang chuẩn bị chữ và hình ảnh…</div>}

      {playing && (
        <div className="presenter-hint">
          Đang trình chiếu · <kbd>Esc</kbd> hoặc nhấp đúp để thoát · <kbd>M</kbd> tắt/bật tiếng
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
      )}
    </div>
  );
}
