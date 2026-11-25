"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sceneSnapTime } from "@/components/PreviewPlayer";
import { FONT_LIB, ensureFontsLoaded } from "@/lib/fonts";
import { scenesForCount } from "@/lib/render/timeline";
import { createDefaultProject, type Aspect, type ProjectData } from "@/lib/project";
import { renderFrame, stageOf, timelineOf } from "@/lib/render/engine";
import { TEMPLATES } from "@/lib/render/templates";
import type { Photo, VideoTemplate } from "@/lib/render/types";

/** Ảnh giả lập để test bố cục có ảnh */
function fakePhoto(hue: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 1600;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 1200, 1600);
  g.addColorStop(0, `hsl(${hue},45%,62%)`);
  g.addColorStop(1, `hsl(${hue + 40},55%,78%)`);
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

function Frame({ tpl, t, data, photos }: { tpl: VideoTemplate; t: number; data: ProjectData; photos: Photo[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { W, H } = stageOf(data);
  const w = W > H ? 640 : 300;
  const h = Math.round((w * H) / W);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ensureFontsLoaded([data.style.titleFont, data.style.bodyFont]).then(() =>
      renderFrame(ctx, t, { template: tpl, data, photos, fonts: FONT_LIB, watermark: null }),
    );
  }, [tpl, t, data, photos]);
  return (
    <figure style={{ margin: 0 }}>
      <canvas ref={ref} width={w} height={h} style={{ width: "100%", display: "block" }} />
      <figcaption style={{ fontSize: 12, color: "var(--muted)" }}>t = {t.toFixed(1)}s</figcaption>
    </figure>
  );
}

export default function FrameSheet() {
  const [q, setQ] = useState<URLSearchParams | null>(null);
  const [fakes, setFakes] = useState<Photo[]>([]);
  useEffect(() => {
    setQ(new URLSearchParams(location.search));
    setFakes([0, 120, 220, 300].map((h) => ({ img: fakePhoto(h), focusY: 0.4 })));
  }, []);
  const data = useMemo<ProjectData | null>(() => {
    if (!q) return null;
    const base = createDefaultProject("x", "an-hoi");
    const long = q.get("long") === "1";
    return {
      ...base,
      id: "dev",
      date: "2026-12-20",
      aspect: (q.get("aspect") as Aspect) || "16:9",
      ...(long ? { groomName: "Nguyễn Hoàng Phương Nam", brideName: "Trần Ngọc Thanh Hương", nameStyle: "full" as const } : {}),
      // &msg=... : thử lời cảm ơn dài / nhiều dòng (dùng %0A để xuống dòng)
      ...(q.get("msg") ? { message: q.get("msg")! } : {}),
      ...(q.get("scenes") ? { scenes: scenesForCount(base.scenes, Number(q.get("scenes")) as 1 | 2 | 3) } : {}),
      // &tr=soft|curtain|fade|zoom|slide : kiểu chuyển cảnh
      ...(q.get("tr") ? { fx: { ...base.fx, transition: q.get("tr") as ProjectData["fx"]["transition"] } } : {}),
      style: {
        ...(q.get("tf") ? { titleFont: q.get("tf")! } : {}),
        ...(q.get("hc") ? { headingColor: `#${q.get("hc")}` } : {}),
      },
    };
  }, [q]);
  if (!q || !data) return null;
  const only = q.get("t");
  const nPhotos = Number(q.get("photos") ?? 1);
  const portrait = data.aspect === "9:16";
  const variants: Array<[string, Photo[]]> = [
    ["không ảnh", []],
    [`${nPhotos} ảnh`, fakes.slice(0, nPhotos)],
  ];

  return (
    <div style={{ padding: 16, display: "grid", gap: 24 }}>
      {TEMPLATES.filter((tpl) => !only || only.split(",").includes(tpl.id)).map((tpl) =>
        variants.map(([label, photos]) => {
          const tl = timelineOf({ data, photos });
          // &at=0.6,1.2,… : chụp đúng các thời điểm này (soi hiệu ứng hiện chữ / chuyển cảnh)
          const at = q.get("at")?.split(",").map(Number).filter((v) => Number.isFinite(v));
          const times = at?.length ? at : [...tl.scenes.map(sceneSnapTime), tl.duration - 0.3];
          return (
            <section key={tpl.id + label}>
              <h3 style={{ margin: "0 0 8px" }}>
                {tpl.name} ({label}) · {tl.duration.toFixed(1)}s
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${portrait ? 5 : 3}, 1fr)`, gap: 8 }}>
                {times.map((t) => (
                  <Frame key={t} tpl={tpl} t={t} data={data} photos={photos} />
                ))}
              </div>
            </section>
          );
        }),
      )}
    </div>
  );
}
