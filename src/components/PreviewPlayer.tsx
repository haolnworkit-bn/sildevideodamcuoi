"use client";

import { useEffect, useRef, useState } from "react";
import { FONT_SET, ensureFontsLoaded } from "@/lib/fonts";
import { renderFrame, type FrameInput } from "@/lib/render/engine";

type Props = Omit<FrameInput, "fonts">;

export default function PreviewPlayer(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const state = useRef({ playing: true, t: 0, last: 0 });
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const D = props.template.duration;

  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    let alive = true;
    ensureFontsLoaded();

    const loop = (now: number) => {
      if (!alive) return;
      const canvas = canvasRef.current;
      const s = state.current;
      const dt = s.last ? (now - s.last) / 1000 : 0;
      s.last = now;
      const dur = propsRef.current.template.duration;
      if (s.playing) s.t = (s.t + Math.min(dt, 0.1)) % dur;
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // preview tối đa 1280px để mượt trên laptop/điện thoại yếu; bản xuất vẫn 1920
        const w = Math.min(1280, Math.round(canvas.clientWidth * dpr));
        const h = Math.round((w * 9) / 16);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) renderFrame(ctx, s.t, { ...propsRef.current, fonts: FONT_SET });
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

  return (
    <div className="player">
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
          value={time}
          onChange={(e) => {
            state.current.t = Number(e.target.value);
            setTime(state.current.t);
          }}
          aria-label="Tua video"
        />
        <span className="time">
          {time.toFixed(1)}s / {D}s
        </span>
      </div>
    </div>
  );
}
