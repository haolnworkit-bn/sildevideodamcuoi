"use client";

import { useEffect, useState } from "react";
import { exportVideo } from "@/lib/export/video";
import { FONT_LIB, ensureFontsLoaded } from "@/lib/fonts";
import { createDefaultProject, type Aspect } from "@/lib/project";
import { getTemplate } from "@/lib/render/templates";
import type { Photo } from "@/lib/render/types";
import { computeTimeline, scenesForCount } from "@/lib/render/timeline";

/** Nhạc thử: hợp âm sin 4 giây */
async function synthAudio(): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, 48000 * 4, 48000);
  for (const f of [261.6, 329.6, 392]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = f;
    g.gain.value = 0.15;
    o.connect(g).connect(ctx.destination);
    o.start();
  }
  return ctx.startRendering();
}

function fakePhoto(hue: number): Photo {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 1200;
  const x = c.getContext("2d")!;
  x.fillStyle = `hsl(${hue},45%,62%)`;
  x.fillRect(0, 0, 900, 1200);
  return { img: c, focusY: 0.4 };
}

export default function ExportProbe() {
  const [log, setLog] = useState("đang chạy…");
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tpl = getTemplate(q.get("template"));
    const loops = Number(q.get("loops") || 1);
    const base = createDefaultProject(tpl.id, "dam-ngo");
    const data = {
      ...base,
      aspect: (q.get("aspect") as Aspect) || "16:9",
      // &scenes=1|2|3 : số cảnh chữ (1 = chỉ Tên & ngày)
      ...(q.get("scenes") ? { scenes: scenesForCount(base.scenes, Number(q.get("scenes")) as 1 | 2 | 3) } : {}),
    };
    const photos = Array.from({ length: Number(q.get("photos") || 0) }, (_, i) => fakePhoto(i * 70));
    const t0 = performance.now();
    const heap = () => (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null;
    const heapStart = heap();
    (async () => {
      await ensureFontsLoaded();
      const audio = q.get("audio") === "1" ? await synthAudio() : null;
      const forceWebm = q.get("webm") === "1";
      const { blob, ext, audioDropped } = await exportVideo({ template: tpl, data, photos, fonts: FONT_LIB, watermark: null, loops, audio, forceWebm });
      const ms = Math.round(performance.now() - t0);
      const heapEnd = heap();
      const durationEstimate = computeTimeline(data, photos.length).duration * loops;
      const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
      const sig = String.fromCharCode(...head.slice(4, 8));
      const u = URL.createObjectURL(blob);
      setUrl(u);
      const v = document.createElement("video");
      v.muted = true;
      v.src = u;
      const meta = await new Promise<string>((r) => {
        v.onloadedmetadata = () => {
          const size = `size=${v.videoWidth}x${v.videoHeight}`;
          if (Number.isFinite(v.duration)) return r(`duration=${v.duration.toFixed(2)}s ${size}`);
          // WebM của MediaRecorder thường thiếu duration trong header → tua tới cuối để trình duyệt tính
          v.ondurationchange = () => {
            if (Number.isFinite(v.duration)) {
              v.ondurationchange = null;
              v.currentTime = 0;
              r(`duration=${v.duration.toFixed(2)}s(headerless) ${size}`);
            }
          };
          v.currentTime = 1e9;
        };
        v.onerror = () => r("meta=error");
      });
      // phát thử 1.5s để đo số byte âm thanh trình duyệt giải mã được
      await v.play().catch(() => undefined);
      await new Promise((r) => setTimeout(r, 1500));
      const audioBytes = (v as HTMLVideoElement & { webkitAudioDecodedByteCount?: number }).webkitAudioDecodedByteCount ?? -1;
      v.pause();
      const speed = (durationEstimate * 1000 / Math.max(1, ms)).toFixed(2);
      const measurement = { format: ext, aspect: data.aspect, template: tpl.id, loops, photos: photos.length, withAudio: !!audio, elapsedMs: ms, outputBytes: blob.size, speedVsRealtimeApprox: Number(speed), jsHeapStartBytes: heapStart, jsHeapEndBytes: heapEnd, metadata: meta, audioDropped, audioDecodedBytes: audioBytes, userAgent: navigator.userAgent };
      setLog(`RESULT ok ext=${ext} bytes=${blob.size} box=${sig} ms=${ms} ${meta} audioDropped=${audioDropped} audioDecodedBytes=${audioBytes}\\nMETRICS ${JSON.stringify(measurement)}`);
    })().catch((e) => setLog(`RESULT error ${String(e?.message ?? e)}`));
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <pre id="result">{log}</pre>
      {url && <video src={url} controls loop style={{ width: 640 }} />}
    </div>
  );
}
