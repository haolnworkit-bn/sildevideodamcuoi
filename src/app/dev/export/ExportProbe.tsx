"use client";

import { useEffect, useState } from "react";
import { exportVideo } from "@/lib/export/video";
import { FONT_SET, ensureFontsLoaded } from "@/lib/fonts";
import { createDefaultProject } from "@/lib/project";
import { getTemplate } from "@/lib/render/templates";

export default function ExportProbe() {
  const [log, setLog] = useState("đang chạy…");
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tpl = getTemplate(q.get("template"));
    const loops = Number(q.get("loops") || 1);
    const t0 = performance.now();
    ensureFontsLoaded()
      .then(() =>
        exportVideo({
          template: tpl,
          data: createDefaultProject(tpl.id, "dam-ngo"),
          photo: null,
          fonts: FONT_SET,
          watermark: null,
          loops,
        }),
      )
      .then(async ({ blob, ext }) => {
        const ms = Math.round(performance.now() - t0);
        const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
        const sig = String.fromCharCode(...head.slice(4, 8));
        const u = URL.createObjectURL(blob);
        setUrl(u);
        // đọc lại độ dài thật bằng trình phát của trình duyệt
        const v = document.createElement("video");
        v.muted = true;
        v.src = u;
        const dur = await new Promise<number>((r) => {
          v.onloadedmetadata = () => r(v.duration);
          v.onerror = () => r(-1);
        });
        setLog(`RESULT ok ext=${ext} bytes=${blob.size} box=${sig} ms=${ms} duration=${dur.toFixed(2)}s`);
      })
      .catch((e) => setLog(`RESULT error ${String(e?.message ?? e)}`));
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <pre id="result">{log}</pre>
      {url && <video src={url} controls loop style={{ width: 640 }} />}
    </div>
  );
}
