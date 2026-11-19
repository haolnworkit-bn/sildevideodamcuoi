"use client";

import { useEffect, useRef, useState } from "react";
import { FONT_LIB, ensureFontsLoaded } from "@/lib/fonts";
import { renderFrame, stageOf, type FrameInput } from "@/lib/render/engine";
import { formatTime } from "@/lib/render/timeline";
import type { Timeline } from "@/lib/render/types";

type Props = Omit<FrameInput, "fonts"> & { timeline: Timeline };

/** Thời điểm đẹp để chụp thumbnail một cảnh (sau khi chữ đã hiện xong) */
export const sceneSnapTime = (s: { start: number; end: number }) => s.start + Math.min(3.2, (s.end - s.start) * 0.6);

export default function PreviewPlayer(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const state = useRef({ playing: true, t: 0, last: 0 });
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const { timeline } = props;
  const D = timeline.duration;
  const portrait = props.data.aspect === "9:16";

  useEffect(() => {
    ensureFontsLoaded([props.data.style.titleFont, props.data.style.bodyFont]);
  }, [props.data.style.titleFont, props.data.style.bodyFont]);

  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    let alive = true;
    const loop = (now: number) => {
      if (!alive) return;
      const canvas = canvasRef.current;
      const s = state.current;
      const dt = s.last ? (now - s.last) / 1000 : 0;
      s.last = now;
      const p = propsRef.current;
      const dur = p.timeline.duration;
      if (s.playing) s.t = (s.t + Math.min(dt, 0.1)) % dur;
      if (canvas) {
        const { W, H } = stageOf(p.data);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // preview tối đa ~1280px cạnh dài để mượt trên máy yếu; bản xuất vẫn Full HD
        const cw = Math.round(canvas.clientWidth * dpr);
        const w = Math.min(cw, Math.round((1280 * W) / Math.max(W, H)));
        const h = Math.round((w * H) / W);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) renderFrame(ctx, s.t, { ...p, fonts: FONT_LIB }, p.timeline);
      }
      if (now - lastUi > 120) {
        lastUi = now;
        setTime(s.t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  const toggle = () => {
    state.current.playing = !state.current.playing;
    setPlaying(state.current.playing);
  };
  const seek = (t: number) => {
    state.current.t = Math.max(0, Math.min(D - 0.01, t));
    setTime(state.current.t);
  };

  return (
    <div className={`player ${portrait ? "portrait" : ""}`}>
      <div className="stage">
        <canvas ref={canvasRef} className="stage-canvas" onClick={toggle} />
      </div>
      <div className="player-bar">
        <button className="btn-icon" onClick={toggle} aria-label={playing ? "Tạm dừng" : "Phát"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={D}
          step={0.01}
          value={Math.min(time, D)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Tua video"
        />
        <span className="time">
          {formatTime(time)} / {formatTime(D)}
        </span>
      </div>
      <div className="scene-strip">
        {timeline.scenes.map((s, i) => {
          const on = time >= s.start && time < s.end;
          return (
            <button key={s.type} className={`scene-chip ${on ? "on" : ""}`} onClick={() => seek(s.start + 0.01)}>
              <SceneThumb {...props} t={sceneSnapTime(s)} />
              <span>
                <strong>
                  {i + 1}. {s.label}
                </strong>
                <small>
                  {formatTime(s.start)} – {formatTime(s.end)}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SceneThumb(p: Props & { t: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { W, H } = stageOf(p.data);
  const w = W > H ? 192 : 60;
  const h = Math.round((w * H) / W);
  const style = W > H ? { width: "100%", aspectRatio: `${W} / ${H}` } : { width: w, height: h };
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let alive = true;
    const draw = () => alive && renderFrame(ctx, p.t, { ...p, watermark: null, fonts: FONT_LIB }, p.timeline);
    draw();
    ensureFontsLoaded([p.data.style.titleFont, p.data.style.bodyFont]).then(draw);
    return () => {
      alive = false;
    };
  }, [p.template, p.data, p.photos, p.timeline, p.t]);
  return <canvas ref={ref} width={w * 2} height={h * 2} style={style} className="scene-thumb" />;
}
