"use client";

import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { renderFrame, stageOf, timelineOf, type FrameInput } from "../render/engine";

export interface ExportOptions extends FrameInput {
  fps?: number;
  /**
   * Số lần lặp vòng trong file (1 = 1 vòng, 15 ≈ 5 phút với vòng 20 giây).
   * Chỉ encode 1 vòng rồi ghép lặp lại các khung đã nén → xuất bản dài nhanh như bản ngắn.
   */
  loops?: number;
  /** Nhạc nền đã giải mã (48 kHz); null = không tiếng */
  audio?: AudioBuffer | null;
  volume?: number;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  ext: "mp4" | "webm";
  /** Có nhạc nền nhưng trình duyệt không mã hoá được AAC → video không tiếng */
  audioDropped: boolean;
}

const SAMPLE_RATE = 48000;
const AUDIO_CFG: AudioEncoderConfig = { codec: "mp4a.40.2", sampleRate: SAMPLE_RATE, numberOfChannels: 2, bitrate: 160_000 };

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Đã huỷ", "AbortError");
}

/** Giải mã file nhạc (mp3/m4a/wav…) về 48 kHz */
export async function decodeAudio(blob: Blob): Promise<AudioBuffer> {
  const ab = await blob.arrayBuffer();
  const ctx = new OfflineAudioContext(2, SAMPLE_RATE, SAMPLE_RATE);
  return ctx.decodeAudioData(ab);
}

async function aacSupported(): Promise<boolean> {
  if (typeof AudioEncoder === "undefined") return false;
  try {
    return !!(await AudioEncoder.isConfigSupported(AUDIO_CFG)).supported;
  } catch {
    return false;
  }
}

/** Xuất video: ưu tiên MP4 H.264 qua WebCodecs (nhanh hơn thời gian thực), fallback WebM. */
export async function exportVideo(o: ExportOptions): Promise<ExportResult> {
  if (typeof window !== "undefined" && "VideoEncoder" in window) {
    const { W, H } = stageOf(o.data);
    const cfg = await pickH264Config(W, H, o.fps ?? 30);
    if (cfg) {
      const withAudio = !!o.audio && (await aacSupported());
      return { blob: await exportMp4(o, cfg, withAudio), ext: "mp4", audioDropped: !!o.audio && !withAudio };
    }
  }
  return { blob: await exportWebmRealtime(o), ext: "webm", audioDropped: !!o.audio };
}

async function pickH264Config(W: number, H: number, fps: number): Promise<VideoEncoderConfig | null> {
  // High → Main → Baseline, level 4.0/5.1 cho 1080p (ngang hoặc dọc)
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.640033", "avc1.42e033"]) {
    const cfg: VideoEncoderConfig = { codec, width: W, height: H, bitrate: 8_000_000, framerate: fps };
    try {
      const s = await VideoEncoder.isConfigSupported(cfg);
      if (s.supported) return cfg;
    } catch {
      /* thử codec tiếp theo */
    }
  }
  return null;
}

function makeCanvas(W: number, H: number) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ canvas 2D");
  return { canvas, ctx };
}

async function exportMp4(o: ExportOptions, cfg: VideoEncoderConfig, withAudio: boolean): Promise<Blob> {
  const fps = o.fps ?? 30;
  const { W, H } = stageOf(o.data);
  const timeline = timelineOf(o);
  const { canvas, ctx } = makeCanvas(W, H);
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: W, height: H, frameRate: fps },
    ...(withAudio ? { audio: { codec: "aac" as const, sampleRate: SAMPLE_RATE, numberOfChannels: 2 } } : {}),
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

  const total = Math.round(timeline.duration * fps);
  const frameDur = Math.round(1e6 / fps);
  const videoShare = withAudio ? 0.85 : 0.95;
  try {
    for (let i = 0; i < total; i++) {
      abortIfNeeded(o.signal);
      if (encodeError) throw encodeError;
      renderFrame(ctx, i / fps, o, timeline);
      const frame = new VideoFrame(canvas, { timestamp: i * frameDur, duration: frameDur });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (encoder.encodeQueueSize > 6) await tick();
      if (i % 5 === 0) {
        o.onProgress?.((i / total) * videoShare);
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
    if (k % 3 === 0) await tick();
  }

  if (withAudio && o.audio) {
    await encodeAudio(o.audio, (loops * loopUs) / 1e6, o.volume ?? 0.8, muxer, o, videoShare);
  }

  muxer.finalize();
  o.onProgress?.(1);
  return new Blob([muxer.target.buffer], { type: "video/mp4" });
}

/** Mã hoá nhạc nền (lặp lại nếu ngắn hơn video), fade-in/out để vòng lặp TV không bị giật tiếng */
async function encodeAudio(
  buf: AudioBuffer,
  seconds: number,
  volume: number,
  muxer: Muxer<ArrayBufferTarget>,
  o: ExportOptions,
  base: number,
) {
  let err: unknown = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => {
      err = e;
    },
  });
  enc.configure(AUDIO_CFG);
  const totalFrames = Math.round(seconds * SAMPLE_RATE);
  const src = [buf.getChannelData(0), buf.getChannelData(Math.min(1, buf.numberOfChannels - 1))];
  const srcLen = buf.length;
  const fadeIn = SAMPLE_RATE * 1;
  const fadeOut = SAMPLE_RATE * 1.5;
  const CH = 4800;
  try {
    for (let pos = 0; pos < totalFrames; pos += CH) {
      abortIfNeeded(o.signal);
      if (err) throw err;
      const n = Math.min(CH, totalFrames - pos);
      const data = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        const g = pos + i;
        const env = volume * Math.min(1, g / fadeIn, (totalFrames - g) / fadeOut);
        const si = g % srcLen;
        data[i] = src[0][si] * env;
        data[n + i] = src[1][si] * env;
      }
      const ad = new AudioData({
        format: "f32-planar",
        sampleRate: SAMPLE_RATE,
        numberOfFrames: n,
        numberOfChannels: 2,
        timestamp: Math.round((pos / SAMPLE_RATE) * 1e6),
        data,
      });
      enc.encode(ad);
      ad.close();
      while (enc.encodeQueueSize > 20) await tick();
      if ((pos / CH) % 50 === 0) {
        o.onProgress?.(base + (1 - base) * 0.95 * (pos / totalFrames));
        await tick();
      }
    }
    await enc.flush();
    if (err) throw err;
  } finally {
    if (enc.state !== "closed") enc.close();
  }
}

/** Ảnh tĩnh PNG đúng tỉ lệ (dùng làm phông in, gửi Zalo, màn LED…) */
export async function exportPoster(input: FrameInput, t: number): Promise<Blob> {
  const { W, H } = stageOf(input.data);
  const { canvas, ctx } = makeCanvas(W, H);
  renderFrame(ctx, t, input);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không tạo được ảnh"))), "image/png"),
  );
}

/** Fallback cho trình duyệt chưa có WebCodecs: ghi canvas theo thời gian thực. */
async function exportWebmRealtime(o: ExportOptions): Promise<Blob> {
  if (typeof MediaRecorder === "undefined") throw new Error("Trình duyệt không hỗ trợ xuất video. Hãy dùng Chrome hoặc Edge bản mới.");
  const { W, H } = stageOf(o.data);
  const timeline = timelineOf(o);
  const { canvas, ctx } = makeCanvas(W, H);
  const fps = o.fps ?? 30;
  const stream = canvas.captureStream(fps);
  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((r) => (rec.onstop = () => r()));
  const D = timeline.duration;

  renderFrame(ctx, 0, o, timeline);
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
      renderFrame(ctx, t, o, timeline);
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
