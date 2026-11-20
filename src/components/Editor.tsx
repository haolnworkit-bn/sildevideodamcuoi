"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FEATURES, formatVnd } from "@/config/features";
import { computeEntitlement, isUnlocked, startCheckout } from "@/lib/billing/entitlements";
import { createProjectBackup, restoreProjectBackup } from "@/lib/backup";
import { loadDraft, saveDraft, takeLegacyPhoto } from "@/lib/draft";
import { isEventType } from "@/lib/events";
import { decodeAudio, detectExportCapability, exportPoster, exportVideo, type ExportCapability } from "@/lib/export/video";
import { FONT_LIB, ensureFontsLoaded } from "@/lib/fonts";
import { deleteBlob, getBlob, loadImage, musicKey, prepareUpload, putBlob } from "@/lib/media";
import { MAX_PHOTOS, createDefaultProject, eventTitle, givenName, uid, type Aspect, type ProjectData } from "@/lib/project";
import { TEMPLATES, getTemplate } from "@/lib/render/templates";
import { computeTimeline, formatTime } from "@/lib/render/timeline";
import { STAGE, type Photo } from "@/lib/render/types";
import { ContentPanel, FxPanel, MusicPanel, PhotosPanel, StylePanel, TemplatesPanel, switchEvent } from "./EditorPanels";
import Presenter from "./Presenter";
import PreviewPlayer, { sceneSnapTime } from "./PreviewPlayer";

type Tab = "mau" | "noidung" | "anh" | "kieu" | "hieuung" | "nhac";
const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "mau", label: "Mẫu", icon: "▦" },
  { id: "noidung", label: "Nội dung", icon: "T" },
  { id: "anh", label: "Ảnh", icon: "🖼" },
  { id: "kieu", label: "Kiểu chữ", icon: "Aa" },
  { id: "hieuung", label: "Hiệu ứng", icon: "✦" },
  { id: "nhac", label: "Nhạc nền", icon: "♪" },
];

type ExportState =
  | { kind: "idle" }
  | { kind: "options" }
  | { kind: "paywall" }
  | { kind: "paying" }
  | { kind: "running"; progress: number; label: string }
  | { kind: "done"; url: string; blob: Blob; ext: string; note?: string }
  | { kind: "error"; message: string };

type LoadedPhoto = { img: HTMLImageElement; url: string };

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function Editor() {
  const params = useSearchParams();
  const [data, setData] = useState<ProjectData | null>(null);
  const [imgs, setImgs] = useState<Record<string, LoadedPhoto>>({});
  const [music, setMusic] = useState<{ blob: Blob; url: string } | null>(null);
  const [tab, setTab] = useState<Tab>("noidung");
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [exp, setExp] = useState<ExportState>({ kind: "idle" });
  const [target, setTarget] = useState(20);
  const [presenting, setPresenting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const resourceRef = useRef<{ imgs: Record<string, LoadedPhoto>; music: string | null; exportUrl: string | null }>({ imgs: {}, music: null, exportUrl: null });
  resourceRef.current = { imgs, music: music?.url ?? null, exportUrl: exp.kind === "done" ? exp.url : null };
  useEffect(() => () => {
    abortRef.current?.abort();
    const r = resourceRef.current;
    Object.values(r.imgs).forEach(p => URL.revokeObjectURL(p.url));
    if (r.music) URL.revokeObjectURL(r.music);
    if (r.exportUrl) URL.revokeObjectURL(r.exportUrl);
  }, []);
  // Khả năng xuất của trình duyệt (MP4 nhanh / WebM thời gian thực / có nhạc không) — kiểm tra khi mở hộp thoại xuất
  const [cap, setCap] = useState<ExportCapability | null>(null);
  const aspect = data?.aspect;
  useEffect(() => {
    if (exp.kind !== "options" || !aspect) return;
    let alive = true;
    const { W, H } = STAGE[aspect];
    detectExportCapability(W, H).then((c) => alive && setCap(c));
    return () => {
      alive = false;
    };
  }, [exp.kind, aspect]);

  // ---------- khởi tạo: bản nháp + query + ảnh/nhạc trong IndexedDB ----------
  useEffect(() => {
    (async () => {
      const tplParam = params.get("template");
      const evParam = params.get("event");
      let d = loadDraft();
      if (!d) {
        d = createDefaultProject(getTemplate(tplParam).id, isEventType(evParam) ? evParam : "dam-ngo");
      } else {
        if (tplParam && TEMPLATES.some((t) => t.id === tplParam)) d = { ...d, templateId: tplParam };
        if (isEventType(evParam)) d = switchEvent(d, evParam);
      }
      // chuyển ảnh của phiên bản cũ (localStorage) sang IndexedDB
      const legacy = takeLegacyPhoto();
      if (legacy && d.photos.length === 0) {
        try {
          const id = uid();
          await putBlob(id, await (await fetch(legacy)).blob());
          const fy = (d as ProjectData & { photoFocusY?: number }).photoFocusY ?? 0.4;
          d = { ...d, photos: [{ id, focusY: fy }] };
        } catch {
          /* bỏ qua */
        }
      }
      const loaded: Record<string, LoadedPhoto> = {};
      for (const m of d.photos) {
        const b = await getBlob(m.id);
        if (!b) continue;
        const url = URL.createObjectURL(b);
        loaded[m.id] = { url, img: await loadImage(url) };
      }
      d = { ...d, photos: d.photos.filter((m) => loaded[m.id]) };
      const mb = await getBlob(musicKey(d.id));
      setImgs(loaded);
      if (mb) setMusic({ blob: mb, url: URL.createObjectURL(mb) });
      setData(d);
      setUnlocked(isUnlocked(d.id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data) saveDraft(data);
  }, [data]);

  const patch = useCallback((p: Partial<ProjectData>) => setData((d) => (d ? { ...d, ...p } : d)), []);

  const photos = useMemo<Array<Photo & { id: string; url: string }>>(
    () =>
      (data?.photos ?? [])
        .filter((m) => imgs[m.id])
        .map((m) => ({ id: m.id, url: imgs[m.id].url, img: imgs[m.id].img, focusY: m.focusY })),
    [data?.photos, imgs],
  );
  const timeline = useMemo(
    () => (data ? computeTimeline(data, photos.length) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.scenes, photos.length],
  );
  const template = getTemplate(data?.templateId);
  const ent = useMemo(() => computeEntitlement(template, unlocked), [template, unlocked]);

  if (!data || !timeline) return <div className="editor-loading">Đang tải trình chỉnh sửa…</div>;

  const D = timeline.duration;
  const portrait = data.aspect === "9:16";
  const fileName = `${slug(eventTitle(data))}-${slug(givenName(data.groomName))}-${slug(givenName(data.brideName))}${portrait ? "-doc" : ""}`;
  const frameInput = (watermark: string | null) => ({ template, data, photos, fonts: FONT_LIB, watermark });

  // ---------- ảnh ----------
  const addPhotos = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      const metas = [...data.photos];
      const next = { ...imgs };
      for (const f of files.slice(0, MAX_PHOTOS - metas.length)) {
        const blob = await prepareUpload(f);
        const id = uid();
        await putBlob(id, blob);
        const url = URL.createObjectURL(blob);
        next[id] = { url, img: await loadImage(url) };
        metas.push({ id, focusY: 0.4 });
      }
      setImgs(next);
      patch({ photos: metas });
    } finally {
      setBusy(false);
    }
  };
  const removePhoto = (id: string) => {
    deleteBlob(id);
    if (imgs[id]) URL.revokeObjectURL(imgs[id].url);
    setImgs(({ [id]: _, ...rest }) => rest);
    patch({ photos: data.photos.filter((m) => m.id !== id) });
  };
  const makeMain = (id: string) => {
    const m = data.photos.find((p) => p.id === id);
    if (m) patch({ photos: [m, ...data.photos.filter((p) => p.id !== id)] });
  };

  // ---------- nhạc ----------
  const uploadMusic = async (f: File) => {
    await putBlob(musicKey(data.id), f);
    if (music) URL.revokeObjectURL(music.url);
    setMusic({ blob: f, url: URL.createObjectURL(f) });
    patch({ music: { ...data.music, enabled: true, name: f.name } });
  };
  const removeMusic = () => {
    deleteBlob(musicKey(data.id));
    if (music) URL.revokeObjectURL(music.url);
    setMusic(null);
    patch({ music: { ...data.music, enabled: false, name: "" } });
  };
  const musicOn = !!music && data.music.enabled;

  const saveBackup = async () => {
    try {
      const blob = await createProjectBackup(data);
      download(blob, `${fileName}-backup.json`);
    } catch (err) { alert((err as Error).message || "Sao lưu thất bại"); }
  };
  const loadBackup = async (file: File) => {
    try {
      const restored = await restoreProjectBackup(file);
      const next: Record<string, LoadedPhoto> = {};
      for (const photo of restored.photos) {
        const b = await getBlob(photo.id);
        if (!b) throw new Error("Không tìm thấy ảnh sau khi phục hồi");
        const url = URL.createObjectURL(b);
        try { next[photo.id] = { url, img: await loadImage(url) }; }
        catch (err) { URL.revokeObjectURL(url); throw err; }
      }
      const song = await getBlob(musicKey(restored.id));
      Object.values(imgs).forEach(p => URL.revokeObjectURL(p.url));
      if (music) URL.revokeObjectURL(music.url);
      setImgs(next);
      setMusic(song ? { blob: song, url: URL.createObjectURL(song) } : null);
      setData(restored);
      setUnlocked(false);
      setExp({ kind: "idle" });
    } catch (err) { alert((err as Error).message || "Phục hồi thất bại"); }
  };

  const newProject = () => {
    if (!confirm("Tạo video mới? Nội dung, ảnh và nhạc hiện tại sẽ bị xoá.")) return;
    data.photos.forEach((m) => deleteBlob(m.id));
    deleteBlob(musicKey(data.id));
    Object.values(imgs).forEach((p) => URL.revokeObjectURL(p.url));
    if (music) URL.revokeObjectURL(music.url);
    setImgs({});
    setMusic(null);
    setData({ ...createDefaultProject(data.templateId, data.eventType), aspect: data.aspect });
    setUnlocked(false);
  };

  // ---------- xuất ----------
  const lengths = [20, 60, 180, 300].map((sec) => {
    const loops = Math.max(1, Math.round(sec / D));
    return { sec, loops, label: formatTime(loops * D), mb: Math.max(1, Math.round(loops * D * 0.9)) };
  });
  const chosen = lengths.find((l) => l.sec === target) ?? lengths[0];

  const runExport = async (watermark: string | null) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setExp({ kind: "running", progress: 0, label: "Đang chuẩn bị…" });
    try {
      await ensureFontsLoaded([data.style.titleFont, data.style.bodyFont]);
      let audio: AudioBuffer | null = null;
      if (musicOn && music) {
        try {
          audio = await decodeAudio(music.blob);
        } catch {
          audio = null;
        }
      }
      const { blob, ext, audioDropped } = await exportVideo({
        ...frameInput(watermark),
        loops: chosen.loops,
        audio,
        volume: data.music.volume,
        signal: ac.signal,
        onProgress: (p) => setExp({ kind: "running", progress: p, label: p < 0.86 || !audio ? "Đang dựng hình…" : "Đang ghép nhạc…" }),
      });
      const note = audioDropped
        ? "Trình duyệt này chưa ghép được nhạc vào video nên file không có tiếng. Hãy dùng Chrome/Edge trên Windows hoặc macOS, hoặc phát nhạc riêng khi trình chiếu."
        : musicOn && !audio
          ? "Không đọc được file nhạc nên video không có tiếng."
          : undefined;
      setExp({ kind: "done", url: URL.createObjectURL(blob), blob, ext, note });
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") setExp({ kind: "idle" });
      else setExp({ kind: "error", message: (e as Error)?.message || "Xuất video thất bại" });
    }
  };

  const savePoster = async () => {
    await ensureFontsLoaded([data.style.titleFont, data.style.bodyFont]);
    const names = timeline.scenes.find((s) => s.type === "names")!;
    const blob = await exportPoster(frameInput(ent.cleanExport ? null : ent.previewWatermark), sceneSnapTime(names) + 1.5);
    download(blob, `${fileName}.png`);
  };

  const startExport = () => (ent.cleanExport ? runExport(null) : setExp({ kind: "paywall" }));

  const pay = async () => {
    setExp({ kind: "paying" });
    const r = await startCheckout(data.id, template.id);
    if (r.status === "paid") {
      setUnlocked(true);
      runExport(null);
    } else if (r.status === "redirect") {
      window.location.href = r.url;
    } else {
      setExp({ kind: "error", message: r.message });
    }
  };

  const canShareFiles = (blob: Blob) => {
    try {
      return typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [new File([blob], "v.mp4", { type: blob.type })] });
    } catch {
      return false;
    }
  };
  const share = async (blob: Blob, ext: string) => {
    try {
      await navigator.share({ files: [new File([blob], `${fileName}.${ext}`, { type: blob.type })], title: eventTitle(data) });
    } catch {
      /* người dùng huỷ */
    }
  };

  const setAspect = (a: Aspect) => patch({ aspect: a });

  return (
    <div className="editor">
      <header className="topbar">
        <Link href="/" className="brand">
          {FEATURES.brandName}
        </Link>
        <span className="topbar-title">
          {eventTitle(data)} · {template.name} · {formatTime(D)}
        </span>
        <div className="segmented small" role="radiogroup" aria-label="Tỉ lệ khung hình">
          {(["16:9", "9:16"] as const).map((a) => (
            <button key={a} className={data.aspect === a ? "on" : ""} onClick={() => setAspect(a)} title={a === "16:9" ? "Chiếu TV, máy chiếu" : "TikTok, Reels, Story"}>
              {a === "16:9" ? "▭ 16:9" : "▯ 9:16"}
            </button>
          ))}
        </div>
        <div className="topbar-actions">
          <input ref={backupInputRef} type="file" accept=".json,application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await loadBackup(f); }} />
          <button className="btn ghost hide-sm" onClick={saveBackup} title="Lưu cả nội dung, ảnh và nhạc">Sao lưu</button>
          <button className="btn ghost hide-sm" onClick={() => backupInputRef.current?.click()} title="Nhập tệp sao lưu">Phục hồi</button>
          <button className="btn ghost hide-sm" onClick={newProject}>
            Video mới
          </button>
          <button className="btn ghost" onClick={() => setPresenting(true)} title="Chiếu toàn màn hình qua HDMI">
            ⛶ <span className="hide-xs">Trình chiếu</span>
          </button>
          <button className="btn primary" onClick={() => setExp({ kind: "options" })}>
            Xuất video
          </button>
        </div>
      </header>

      <div className="editor-body">
        <nav className="rail" aria-label="Công cụ">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
              <i>{t.icon}</i>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <aside className="panel">
          {tab === "mau" && <TemplatesPanel data={data} patch={patch} photos={photos} />}
          {tab === "noidung" && <ContentPanel data={data} patch={patch} setData={setData} photoCount={photos.length} />}
          {tab === "anh" && (
            <PhotosPanel data={data} patch={patch} photos={photos} onAdd={addPhotos} onRemove={removePhoto} onMakeMain={makeMain} busy={busy} />
          )}
          {tab === "kieu" && <StylePanel data={data} patch={patch} />}
          {tab === "hieuung" && <FxPanel data={data} patch={patch} />}
          {tab === "nhac" && <MusicPanel data={data} patch={patch} musicUrl={music?.url ?? null} onUpload={uploadMusic} onRemove={removeMusic} />}
        </aside>

        <main className="preview-area">
          <PreviewPlayer template={template} data={data} photos={photos} watermark={ent.previewWatermark} timeline={timeline} />
          <p className="spec">
            {portrait ? "Dọc 1080×1920 · TikTok, Reels, Story" : "Ngang 1920×1080 · chiếu TV, máy chiếu"} · {timeline.scenes.length} cảnh ·{" "}
            {formatTime(D)} lặp liền mạch · {musicOn ? `♪ ${data.music.name}` : "chưa có nhạc nền"}
            {ent.previewWatermark && (
              <>
                {" "}
                · <strong>Bản xem trước có watermark</strong>
              </>
            )}
          </p>
        </main>
      </div>

      {presenting && (
        <Presenter
          template={template}
          data={data}
          photos={photos}
          watermark={ent.previewWatermark}
          musicUrl={musicOn ? music!.url : null}
          volume={data.music.volume}
          onClose={() => setPresenting(false)}
        />
      )}

      {exp.kind !== "idle" && (
        <div className="modal-backdrop" onClick={() => exp.kind !== "running" && setExp({ kind: "idle" })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {exp.kind === "options" && (
              <>
                <h2>Xuất video {portrait ? "dọc 9:16" : "ngang 16:9"}</h2>
                <div className="length-grid" role="radiogroup" aria-label="Độ dài video">
                  {lengths.map((l) => (
                    <button key={l.sec} role="radio" aria-checked={target === l.sec} className={`length ${target === l.sec ? "on" : ""}`} onClick={() => setTarget(l.sec)}>
                      <strong>{l.label}</strong>
                      <small>≈ {l.mb} MB</small>
                    </button>
                  ))}
                </div>
                <p className="hint">
                  {chosen.loops === 1
                    ? portrait
                      ? "Một vòng, vừa để đăng TikTok / Reels / Story."
                      : "Nhẹ nhất. Bật chế độ lặp lại trên TV."
                    : `Lặp ${chosen.loops} vòng trong một file, cho TV không có chế độ lặp lại.`}
                  {musicOn ? ` Có nhạc nền: ${data.music.name}.` : ""}
                </p>
                {cap && !cap.mp4 && cap.webm && (
                  <p className="warn">
                    Trình duyệt này không xuất được MP4 nhanh. Video sẽ là file <strong>WebM</strong>, ghi theo thời gian thực:
                    mất khoảng <strong>{chosen.label}</strong> và phải để nguyên tab này mở. Một số TV không mở được WebM, nên
                    dùng Chrome hoặc Edge trên máy tính để có file MP4.
                  </p>
                )}
                {cap && musicOn && (cap.mp4 ? !cap.mp4Audio : cap.webm && !cap.webmAudio) && (
                  <p className="warn">Trình duyệt này không ghép được nhạc vào video, file xuất ra sẽ không có tiếng.</p>
                )}
                {cap && !cap.mp4 && !cap.webm && (
                  <p className="warn">Trình duyệt này không hỗ trợ xuất video. Hãy dùng Chrome hoặc Edge bản mới, hoặc dùng nút Trình chiếu.</p>
                )}
                <div className="modal-actions">
                  <button className="btn primary" onClick={startExport} disabled={!!cap && !cap.mp4 && !cap.webm}>
                    Xuất {cap && !cap.mp4 ? "WebM" : "MP4"} {chosen.label}
                  </button>
                  <button className="btn ghost" onClick={savePoster}>
                    Tải ảnh PNG
                  </button>
                </div>
                {!portrait && (
                  <p className="hint">
                    Cắm laptop vào TV qua HDMI? Không cần xuất, dùng nút <strong>⛶ Trình chiếu</strong>.
                  </p>
                )}
              </>
            )}
            {exp.kind === "paywall" && (
              <>
                <h2>Xuất video không watermark</h2>
                <p>
                  Mở khoá video <strong>{eventTitle(data)}</strong> với mẫu <strong>{template.name}</strong>: tải MP4 Full HD không giới hạn số lần.
                </p>
                <div className="price">{formatVnd(ent.price)}</div>
                <div className="modal-actions">
                  <button className="btn primary" onClick={pay}>
                    Thanh toán & xuất video
                  </button>
                  {ent.watermarkedExport && (
                    <button className="btn ghost" onClick={() => runExport(ent.previewWatermark)}>
                      Tải bản có watermark (miễn phí)
                    </button>
                  )}
                </div>
              </>
            )}
            {exp.kind === "paying" && <p>Đang tạo phiên thanh toán…</p>}
            {exp.kind === "running" && (
              <>
                <h2>{exp.label}</h2>
                <div className="progress">
                  <div style={{ width: `${Math.round(exp.progress * 100)}%` }} />
                </div>
                <p className="hint">{Math.round(exp.progress * 100)}% · Giữ tab này mở trong lúc xuất</p>
                <button className="btn ghost" onClick={() => abortRef.current?.abort()}>
                  Huỷ
                </button>
              </>
            )}
            {exp.kind === "done" && (
              <>
                <h2>Video đã sẵn sàng 🎉</h2>
                <video src={exp.url} controls loop autoPlay playsInline className={`result-video ${portrait ? "portrait" : ""}`} />
                {exp.note && <p className="warn">{exp.note}</p>}
                <div className="modal-actions">
                  <button className="btn primary" onClick={() => download(exp.blob, `${fileName}.${exp.ext}`)}>
                    Tải về ({(exp.blob.size / 1e6).toFixed(0)} MB)
                  </button>
                  {canShareFiles(exp.blob) && (
                    <button className="btn ghost" onClick={() => share(exp.blob, exp.ext)}>
                      Chia sẻ (Zalo, Messenger…)
                    </button>
                  )}
                  <button className="btn ghost" onClick={() => setExp({ kind: "options" })}>
                    Quay lại
                  </button>
                </div>
                {exp.ext === "webm" ? (
                  <p className="hint">
                    Trình duyệt này chưa hỗ trợ xuất MP4 nên video ở dạng WebM (nhiều TV không đọc được). Hãy mở bằng Chrome hoặc Edge bản mới để có MP4.
                  </p>
                ) : portrait ? (
                  <p className="hint">Đăng lên TikTok, Facebook Reels hoặc Story: chọn file vừa tải ở mục tải lên video.</p>
                ) : (
                  <details className="tv-guide" open>
                    <summary>Cách chiếu lên TV</summary>
                    <ol>
                      <li>Chép file .mp4 vào USB (định dạng FAT32 hoặc exFAT).</li>
                      <li>Cắm USB vào TV → mở ứng dụng Media / Trình phát video / USB.</li>
                      <li>
                        Chọn video, bật <strong>Lặp lại (Repeat)</strong> trong menu tuỳ chọn. TV không có chế độ này thì xuất bản 5 phút.
                      </li>
                      <li>Hoặc tải lên YouTube (chế độ không công khai) rồi mở trên Smart TV và bật lặp lại.</li>
                    </ol>
                  </details>
                )}
              </>
            )}
            {exp.kind === "error" && (
              <>
                <h2>Có lỗi xảy ra</h2>
                <p>{exp.message}</p>
                <button className="btn ghost" onClick={() => setExp({ kind: "idle" })}>
                  Đóng
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
