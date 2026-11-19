"use client";

import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { renderFrame, type FrameInput } from "../render/engine";
import { STAGE_H, STAGE_W } from "../render/types";

export interface ExportOptions extends FrameInput {
  fps?: number;
  /**
   * Số lần lặp vòng 20 giây trong file (1 = 20s, 3 = 1 phút, 15 = 5 phút).
   * Chỉ encode 1 vòng rồi ghép lặp lại các khung đã nén → xuất 5 phút nhanh như 20 giây.
   * Dành cho TV không có chế độ "lặp lại".
   */
  loops?: number;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  ext: "mp4" | "webm";
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Đã huỷ", "AbortError");
}

/** Xuất video: ưu tiên MP4 H.264 qua WebCodecs (nhanh hơn thời gian thực), fallback WebM. */
export async function exportVideo(o: ExportOptions): Promise<ExportResult> {
  if (typeof window !== "undefined" && "VideoEncoder" in window) {
    const cfg = await pickH264Config(o.fps ?? 30);
    if (cfg) return { blob: await exportMp4(o, cfg), ext: "mp4" };
  }
  return { blob: await exportWebmRealtime(o), ext: "webm" };
}

async function pickH264Config(fps: number): Promise<VideoEncoderConfig | null> {
  // High → Main → Baseline, level 4.0/5.1 cho 1080p
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.640033", "avc1.42e033"]) {
    const cfg: VideoEncoderConfig = {
      codec,
      width: STAGE_W,
      height: STAGE_H,
      bitrate: 8_000_000,
      framerate: fps,
    };
    try {
      const s = await VideoEncoder.isConfigSupported(cfg);
      if (s.supported) return cfg;
    } catch {
      /* thử codec tiếp theo */
    }
  }
  return null;
}

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = STAGE_W;
  canvas.height = STAGE_H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ canvas 2D");
  return { canvas, ctx };
}

async function exportMp4(o: ExportOptions, cfg: VideoEncoderConfig): Promise<Blob> {
  const fps = o.fps ?? 30;
  const { canvas, ctx } = makeCanvas();
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: STAGE_W, height: STAGE_H, frameRate: fps },
    fastStart: "in-memory",
  });
  type Stored = { data: Uint8Array; type: "key" | "delta"; ts: number; dur: number; meta?: EncodedVideoChunkMetadata };
  const chunks: Stored[] = [];
  let encodeError: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      chunks.push({ data, type: chunk.type, ts: chunk.timestamp, dur: chunk.duration ?? 0, meta });
    },
    error: (e) => {
      encodeError = e;
    },
  });
  encoder.configure(cfg);

  const total = Math.round(o.template.duration * fps);
  const frameDur = Math.round(1e6 / fps);
  try {
    for (let i = 0; i < total; i++) {
      abortIfNeeded(o.signal);
      if (encodeError) throw encodeError;
      renderFrame(ctx, i / fps, o);
      const frame = new VideoFrame(canvas, { timestamp: i * frameDur, duration: frameDur });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (encoder.encodeQueueSize > 6) await tick();
      if (i % 5 === 0) {
        o.onProgress?.((i / total) * 0.95);
        await tick();
      }
    }
    await encoder.flush();
    if (encodeError) throw encodeError;
  } finally {
    if (encoder.state !== "closed") encoder.close();
  }

  // Ghép N vòng: khung đầu mỗi vòng là keyframe nên nối liền mạch
  const loops = Math.max(1, Math.round(o.loops ?? 1));
  const loopUs = total * frameDur;
  for (let k = 0; k < loops; k++) {
    abortIfNeeded(o.signal);
    for (const c of chunks) {
      muxer.addVideoChunkRaw(c.data, c.type, c.ts + k * loopUs, c.dur || frameDur, k === 0 ? c.meta : undefined);
    }
    if (k % 3 === 0) {
      o.onProgress?.(0.95 + (0.05 * k) / loops);
      await tick();
    }
  }
  muxer.finalize();
  o.onProgress?.(1);
  return new Blob([muxer.target.buffer], { type: "video/mp4" });
}

/** Ảnh tĩnh PNG 1920×1080 (dùng làm phông in, gửi Zalo, màn LED…) */
export async function exportPoster(input: FrameInput, t: number): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  renderFrame(ctx, t, input);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không tạo được ảnh"))), "image/png"),
  );
}

/** Fallback cho trình duyệt chưa có WebCodecs: ghi canvas theo thời gian thực (mất đúng 20 giây). */
async function exportWebmRealtime(o: ExportOptions): Promise<Blob> {
  if (typeof MediaRecorder === "undefined") throw new Error("Trình duyệt không hỗ trợ xuất video. Hãy dùng Chrome hoặc Edge bản mới.");
  const { canvas, ctx } = makeCanvas();
  const fps = o.fps ?? 30;
  const stream = canvas.captureStream(fps);
  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) =>
    MediaRecorder.isTypeSupported(m),
  );
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((r) => (rec.onstop = () => r()));
  const D = o.template.duration;

  renderFrame(ctx, 0, o);
  rec.start(250);
  const t0 = performance.now();
  await new Promise<void>((resolve, reject) => {
    const loop = () => {
      if (o.signal?.aborted) {
        rec.stop();
        reject(new DOMException("Đã huỷ", "AbortError"));
        return;
      }
      const t = (performance.now() - t0) / 1000;
      if (t >= D) return resolve();
      renderFrame(ctx, t, o);
      o.onProgress?.(t / D);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  rec.stop();
  await done;
  o.onProgress?.(1);
  return new Blob(chunks, { type: "video/webm" });
}
