"use client";

import { useEffect, useState } from "react";
import { FONT_LIB, ensureFontsLoaded } from "@/lib/fonts";
import { createDefaultProject, type Aspect } from "@/lib/project";
import { renderFrame, stageOf, timelineOf } from "@/lib/render/engine";
import { getTemplate } from "@/lib/render/templates";
import type { Photo } from "@/lib/render/types";

function fakePhoto(hue: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 1600;
  const x = c.getContext("2d")!;
  x.fillStyle = `hsl(${hue},45%,62%)`;
  x.fillRect(0, 0, 1200, 1600);
  return c;
}

/**
 * /dev/perf?template=<id>&tr=soft&photos=1&w=1280&aspect=16:9
 * Vẽ mọi khung hình (30 hình/giây) của 1 vòng lên canvas cỡ preview, đo ms/khung → RESULT {max, p95, chậm nhất}.
 */
export default function PerfProbe() {
  const [log, setLog] = useState("đang đo…");
  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(location.search);
      if (q.get("snap")) {
        // chữ có bị làm tròn vị trí theo điểm ảnh không? vẽ ở x lệch 0.1..0.9px, so ảnh
        const c = document.createElement("canvas");
        c.width = 400;
        c.height = 100;
        const x = c.getContext("2d")!;
        const shot = (dx: number, sc = 1) => {
          x.setTransform(1, 0, 0, 1, 0, 0);
          x.clearRect(0, 0, 400, 100);
          x.setTransform(sc, 0, 0, sc, 0, 0);
          x.font = "40px serif";
          x.fillStyle = "#000";
          x.fillText("Quân & Hà", 20 + dx, 60);
          return Array.from(x.getImageData(0, 0, 400, 100).data).join(",");
        };
        const base = shot(0);
        const res = [0.1, 0.25, 0.5, 0.75].map((d) => `${d}:${shot(d) === base ? "SAME" : "diff"}`);
        const base2 = shot(0, 1);
        const sres = [1.001, 1.003, 1.01].map((k) => `${k}:${shot(0, k) === base2 ? "SAME" : "diff"}`);
        setLog(`RESULT translate ${res.join(" ")} | scale ${sres.join(" ")}`);
        return;
      }
      const tpl = getTemplate(q.get("template"));
      const base = createDefaultProject(tpl.id, "an-hoi");
      const data = {
        ...base,
        aspect: (q.get("aspect") as Aspect) || "16:9",
        fx: { ...base.fx, transition: (q.get("tr") as typeof base.fx.transition) || base.fx.transition },
      };
      const photos: Photo[] = Array.from({ length: Number(q.get("photos") ?? 1) }, (_, i) => ({ img: fakePhoto(i * 70), focusY: 0.4 }));
      await ensureFontsLoaded([]);
      const { W, H } = stageOf(data);
      const w = Number(q.get("w") || 1280);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = Math.round((w * H) / W);
      document.body.appendChild(c);
      const ctx = c.getContext("2d")!;
      const tl = timelineOf({ data, photos });
      const input = { template: tpl, data, photos, fonts: FONT_LIB, watermark: null };
      for (let i = 0; i < 30; i++) renderFrame(ctx, i / 30, input, tl); // khởi động
      const rows: Array<[number, number]> = [];
      const N = Math.floor(tl.duration * 30);
      for (let f = 0; f < N; f++) {
        const t = f / 30;
        const t0 = performance.now();
        renderFrame(ctx, t, input, tl);
        ctx.getImageData(0, 0, 1, 1); // ép GPU vẽ xong để đo đúng
        rows.push([t, performance.now() - t0]);
      }
      const ms = rows.map((r) => r[1]).sort((a, b) => a - b);
      const pct = (p: number) => ms[Math.min(ms.length - 1, Math.floor(ms.length * p))].toFixed(1);
      const slow = [...rows].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, m]) => `${t.toFixed(2)}:${m.toFixed(1)}`);
      const over = rows.filter((r) => r[1] > 16.7).length;
      setLog(`RESULT frames=${N} avg=${(ms.reduce((s, v) => s + v, 0) / N).toFixed(1)} p50=${pct(0.5)} p95=${pct(0.95)} max=${ms[ms.length - 1].toFixed(1)} over16ms=${over} slow=${slow.join(" ")}`);
    })().catch((e) => setLog(`RESULT error ${String(e?.message ?? e)}`));
  }, []);
  return <pre id="result" style={{ padding: 24 }}>{log}</pre>;
}
