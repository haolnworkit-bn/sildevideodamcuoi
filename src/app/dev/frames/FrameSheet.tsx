"use client";

import { useEffect, useRef, useState } from "react";
import { FONT_SET, ensureFontsLoaded } from "@/lib/fonts";
import { createDefaultProject, type ProjectData } from "@/lib/project";
import { renderFrame } from "@/lib/render/engine";
import { TEMPLATES } from "@/lib/render/templates";
import type { VideoTemplate } from "@/lib/render/types";

const TIMES = [3, 6.6, 10, 16.5, 19.7, 0.2];

/** Ảnh giả lập để test bố cục có ảnh */
function fakePhoto(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 1600;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 1200, 1600);
  g.addColorStop(0, "#7a9cc6");
  g.addColorStop(1, "#e8b4a0");
  x.fillStyle = g;
  x.fillRect(0, 0, 1200, 1600);
  x.fillStyle = "rgba(40,30,30,0.55)";
  for (const cx of [460, 760]) {
    x.beginPath();
    x.arc(cx, 620, 130, 0, Math.PI * 2);
    x.fill();
    x.fillRect(cx - 170, 780, 340, 820);
  }
  return c;
}

function Frame({ tpl, t, data, photo }: { tpl: VideoTemplate; t: number; data: ProjectData; photo: CanvasImageSource | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ensureFontsLoaded().then(() =>
      renderFrame(ctx, t, { template: tpl, data, photo: photo as HTMLImageElement | null, fonts: FONT_SET, watermark: null }),
    );
  }, [tpl, t, data, photo]);
  return (
    <figure style={{ margin: 0 }}>
      <canvas ref={ref} width={640} height={360} style={{ width: "100%", display: "block" }} />
      <figcaption style={{ fontSize: 12, color: "var(--muted)" }}>t = {t}s</figcaption>
    </figure>
  );
}

export default function FrameSheet() {
  const [photo, setPhoto] = useState<HTMLCanvasElement | null>(null);
  const [longNames, setLongNames] = useState(false);
  const [only, setOnly] = useState<string | null>(null);
  useEffect(() => {
    setPhoto(fakePhoto());
    const q = new URLSearchParams(location.search);
    setOnly(q.get("t"));
    setLongNames(q.get("long") === "1");
  }, []);
  const base = createDefaultProject("x", "an-hoi");
  const data: ProjectData = {
    ...base,
    id: "dev",
    date: "2026-12-20",
    ...(longNames
      ? { groomName: "Nguyễn Hoàng Phương Nam", brideName: "Trần Ngọc Thanh Hương", nameStyle: "full" as const }
      : {}),
  };
  return (
    <div style={{ padding: 16, display: "grid", gap: 24 }}>
      <label>
        <input type="checkbox" checked={longNames} onChange={(e) => setLongNames(e.target.checked)} /> Tên dài
      </label>
      {TEMPLATES.filter((tpl) => !only || only.split(",").includes(tpl.id)).map((tpl) =>
        [null, photo].map((p, i) => (
          <section key={tpl.id + i}>
            <h3 style={{ margin: "0 0 8px" }}>
              {tpl.name} {i ? "(có ảnh)" : "(không ảnh)"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TIMES.map((t) => (
                <Frame key={t} tpl={tpl} t={t} data={data} photo={p} />
              ))}
            </div>
          </section>
        )),
      )}
    </div>
  );
}
