"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FEATURES, formatVnd } from "@/config/features";
import { computeEntitlement, isUnlocked, startCheckout } from "@/lib/billing/entitlements";
import { loadDraft, loadDraftPhoto, loadImage, prepareUpload, saveDraft, saveDraftPhoto } from "@/lib/draft";
import { EVENT_LIST, EVENT_TYPES, isEventType, type EventTypeId } from "@/lib/events";
import { exportPoster, exportVideo } from "@/lib/export/video";
import { FONT_SET, ensureFontsLoaded } from "@/lib/fonts";
import { createDefaultProject, dateInfo, eventTitle, givenName, type ProjectData } from "@/lib/project";
import { TEMPLATES, getTemplate } from "@/lib/render/templates";
import Presenter from "./Presenter";
import PreviewPlayer from "./PreviewPlayer";
import TemplateThumb from "./TemplateThumb";

type ExportState =
  | { kind: "idle" }
  | { kind: "options" }
  | { kind: "paywall" }
  | { kind: "paying" }
  | { kind: "running"; progress: number }
  | { kind: "done"; url: string; blob: Blob; ext: string }
  | { kind: "error"; message: string };

const LENGTHS = [
  { loops: 1, label: "20 giây", hint: "Nhẹ nhất, bật chế độ lặp lại trên TV" },
  { loops: 3, label: "1 phút", hint: "" },
  { loops: 9, label: "3 phút", hint: "" },
  { loops: 15, label: "5 phút", hint: "Cho TV không có chế độ lặp lại" },
];

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

/** Đổi loại lễ; nếu đang dùng lời cảm ơn mẫu thì đổi luôn sang lời mẫu của loại mới */
function switchEvent(d: ProjectData, ev: EventTypeId): ProjectData {
  if (d.eventType === ev) return d;
  const usingDefault = d.message.trim() === EVENT_TYPES[d.eventType].defaultMessage;
  return { ...d, eventType: ev, message: usingDefault ? EVENT_TYPES[ev].defaultMessage : d.message };
}

export default function Editor() {
  const params = useSearchParams();
  const [data, setData] = useState<ProjectData | null>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [exp, setExp] = useState<ExportState>({ kind: "idle" });
  const [loops, setLoops] = useState(1);
  const [presenting, setPresenting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Khởi tạo từ bản nháp + query (?template=...&event=...)
  useEffect(() => {
    const tplParam = params.get("template");
    const evParam = params.get("event");
    let d = loadDraft();
    if (!d) {
      d = createDefaultProject(getTemplate(tplParam).id, isEventType(evParam) ? evParam : "dam-ngo");
    } else {
      if (tplParam && TEMPLATES.some((t) => t.id === tplParam)) d = { ...d, templateId: tplParam };
      if (isEventType(evParam)) d = switchEvent(d, evParam);
    }
    setData(d);
    setUnlocked(isUnlocked(d.id));
    const p = loadDraftPhoto();
    if (p) loadImage(p).then(setPhoto).catch(() => saveDraftPhoto(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data) saveDraft(data);
  }, [data]);

  const template = getTemplate(data?.templateId);
  const ent = useMemo(() => computeEntitlement(template, unlocked), [template, unlocked]);

  if (!data) return <div className="editor-loading">Đang tải trình chỉnh sửa…</div>;

  const set = <K extends keyof ProjectData>(k: K, v: ProjectData[K]) =>
    setData((d) => (d ? { ...d, [k]: v } : d));

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    const url = await prepareUpload(file);
    saveDraftPhoto(url);
    setPhoto(await loadImage(url));
  };

  const newProject = () => {
    if (!confirm("Tạo video mới? Nội dung hiện tại sẽ bị thay thế.")) return;
    setData(createDefaultProject(data.templateId, data.eventType));
    setUnlocked(false);
    setPhoto(null);
    saveDraftPhoto(null);
  };

  const fileName = `${slug(eventTitle(data))}-${slug(givenName(data.groomName))}-${slug(givenName(data.brideName))}`;
  const frameInput = (watermark: string | null) => ({ template, data, photo, fonts: FONT_SET, watermark });

  const runExport = async (watermark: string | null) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setExp({ kind: "running", progress: 0 });
    try {
      await ensureFontsLoaded();
      const { blob, ext } = await exportVideo({
        ...frameInput(watermark),
        loops,
        signal: ac.signal,
        onProgress: (p) => setExp({ kind: "running", progress: p }),
      });
      setExp({ kind: "done", url: URL.createObjectURL(blob), blob, ext });
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") setExp({ kind: "idle" });
      else setExp({ kind: "error", message: (e as Error)?.message || "Xuất video thất bại" });
    }
  };

  const savePoster = async () => {
    await ensureFontsLoaded();
    const blob = await exportPoster(frameInput(ent.cleanExport ? null : ent.previewWatermark), template.posterTime ?? 17);
    download(blob, `${fileName}.png`);
  };

  const startExport = () => {
    if (ent.cleanExport) runExport(null);
    else setExp({ kind: "paywall" });
  };

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

  const share = async (blob: Blob, ext: string) => {
    const file = new File([blob], `${fileName}.${ext}`, { type: blob.type });
    try {
      await navigator.share({ files: [file], title: eventTitle(data) });
    } catch {
      /* người dùng huỷ */
    }
  };
  const canShareFiles = (blob: Blob) => {
    try {
      return typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [new File([blob], "v.mp4", { type: blob.type })] });
    } catch {
      return false;
    }
  };

  const info = dateInfo(data);

  return (
    <div className="editor">
      <header className="topbar">
        <Link href="/" className="brand">
          {FEATURES.brandName}
        </Link>
        <span className="topbar-title">
          {eventTitle(data)} · {template.name}
        </span>
        <div className="topbar-actions">
          <button className="btn ghost hide-sm" onClick={newProject}>
            Video mới
          </button>
          <button className="btn ghost" onClick={() => setPresenting(true)} title="Chiếu toàn màn hình qua HDMI">
            ⛶ Trình chiếu
          </button>
          <button className="btn primary" onClick={() => setExp({ kind: "options" })}>
            Xuất video
          </button>
        </div>
      </header>

      <div className="editor-body">
        <aside className="panel">
          <section className="field-group">
            <h3>Loại lễ</h3>
            <div className="chips">
              {EVENT_LIST.map((e) => (
                <button
                  key={e.id}
                  className={`chip ${data.eventType === e.id ? "on" : ""}`}
                  onClick={() => setData(switchEvent(data, e.id))}
                >
                  {e.label}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Tiêu đề hiển thị</span>
              <input
                value={data.title}
                placeholder={EVENT_TYPES[data.eventType].title}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Lời chào mở đầu</span>
              <input
                value={data.greeting}
                placeholder="Để trống nếu không muốn hiện"
                onChange={(e) => set("greeting", e.target.value)}
              />
            </label>
          </section>

          <section className="field-group">
            <h3>Mẫu video ({TEMPLATES.length})</h3>
            <div className="tpl-grid">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className={`tpl-pick ${t.id === data.templateId ? "on" : ""}`}
                  onClick={() => set("templateId", t.id)}
                  title={t.description}
                >
                  <TemplateThumb template={t} eventType={data.eventType} data={data} at={2.5} />
                  <span>
                    {t.name}
                    {FEATURES.monetization && t.tier === "premium" && <em className="badge">Premium</em>}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="field-group">
            <h3>Cô dâu & chú rể</h3>
            <label className="field">
              <span>Họ tên chú rể</span>
              <input value={data.groomName} onChange={(e) => set("groomName", e.target.value)} />
            </label>
            <label className="field">
              <span>Họ tên cô dâu</span>
              <input value={data.brideName} onChange={(e) => set("brideName", e.target.value)} />
            </label>
            <div className="row even">
              <label className="field">
                <span>Tên ở cảnh lớn</span>
                <select
                  value={data.nameStyle}
                  onChange={(e) => set("nameStyle", e.target.value as ProjectData["nameStyle"])}
                >
                  <option value="short">
                    Tên gọi ({givenName(data.groomName)} & {givenName(data.brideName)})
                  </option>
                  <option value="full">Họ tên đầy đủ</option>
                </select>
              </label>
              <label className="field">
                <span>Thứ tự</span>
                <select
                  value={data.nameOrder}
                  onChange={(e) => set("nameOrder", e.target.value as ProjectData["nameOrder"])}
                >
                  <option value="groom-first">Chú rể trước</option>
                  <option value="bride-first">Cô dâu trước</option>
                </select>
              </label>
            </div>
          </section>

          <section className="field-group">
            <h3>Thời gian & địa điểm</h3>
            <div className="row">
              <label className="field">
                <span>Ngày (dương lịch)</span>
                <input type="date" value={data.date} onChange={(e) => set("date", e.target.value)} />
              </label>
              <label className="field">
                <span>Giờ</span>
                <input type="time" value={data.time} onChange={(e) => set("time", e.target.value)} />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" checked={data.showLunar} onChange={(e) => set("showLunar", e.target.checked)} />
              <span>
                Hiện ngày âm lịch
                {info.valid && (
                  <small>
                    {" "}
                    ({info.weekday}, {info.lunar || "ẩn"})
                  </small>
                )}
              </span>
            </label>
            <label className="field">
              <span>Địa điểm</span>
              <input
                value={data.venue}
                placeholder="VD: Tư gia nhà gái"
                onChange={(e) => set("venue", e.target.value)}
              />
            </label>
          </section>

          <section className="field-group">
            <h3>Lời cảm ơn</h3>
            <label className="field">
              <textarea
                rows={4}
                value={data.message}
                maxLength={320}
                onChange={(e) => set("message", e.target.value)}
              />
              <small className="hint">{data.message.length}/320 ký tự</small>
            </label>
            <button className="link" onClick={() => set("message", EVENT_TYPES[data.eventType].defaultMessage)}>
              Dùng lời mẫu
            </button>
          </section>

          <section className="field-group">
            <h3>Ảnh cặp đôi</h3>
            <label className="upload">
              <input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} />
              {photo ? "Đổi ảnh khác" : "Chọn ảnh (không bắt buộc)"}
            </label>
            {photo && (
              <>
                <label className="field">
                  <span>Căn ảnh theo chiều dọc (giữ khuôn mặt trong khung)</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={data.photoFocusY}
                    onChange={(e) => set("photoFocusY", Number(e.target.value))}
                  />
                </label>
                <button
                  className="link"
                  onClick={() => {
                    setPhoto(null);
                    saveDraftPhoto(null);
                  }}
                >
                  Bỏ ảnh
                </button>
              </>
            )}
          </section>
        </aside>

        <main className="preview-area">
          <PreviewPlayer template={template} data={data} photo={photo} watermark={ent.previewWatermark} />
          <p className="spec">
            Full HD 1920×1080 · vòng lặp {template.duration} giây liền mạch · tự động lưu nháp
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
          photo={photo}
          watermark={ent.previewWatermark}
          onClose={() => setPresenting(false)}
        />
      )}

      {exp.kind !== "idle" && (
        <div className="modal-backdrop" onClick={() => exp.kind !== "running" && setExp({ kind: "idle" })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {exp.kind === "options" && (
              <>
                <h2>Xuất video</h2>
                <div className="length-grid" role="radiogroup" aria-label="Độ dài video">
                  {LENGTHS.map((l) => (
                    <button
                      key={l.loops}
                      role="radio"
                      aria-checked={loops === l.loops}
                      className={`length ${loops === l.loops ? "on" : ""}`}
                      onClick={() => setLoops(l.loops)}
                    >
                      <strong>{l.label}</strong>
                      <small>≈ {Math.round(l.loops * 18)} MB</small>
                    </button>
                  ))}
                </div>
                <p className="hint">{LENGTHS.find((l) => l.loops === loops)?.hint || "Video lặp lại nhiều vòng trong một file"}</p>
                <div className="modal-actions">
                  <button className="btn primary" onClick={startExport}>
                    Xuất MP4 {LENGTHS.find((l) => l.loops === loops)?.label}
                  </button>
                  <button className="btn ghost" onClick={savePoster}>
                    Tải ảnh PNG
                  </button>
                </div>
                <p className="hint">
                  Cắm laptop vào TV qua HDMI? Không cần xuất, dùng nút <strong>⛶ Trình chiếu</strong>.
                </p>
              </>
            )}
            {exp.kind === "paywall" && (
              <>
                <h2>Xuất video không watermark</h2>
                <p>
                  Mở khoá video <strong>{eventTitle(data)}</strong> với mẫu <strong>{template.name}</strong>: tải MP4
                  Full HD không giới hạn số lần.
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
                <h2>Đang xuất video…</h2>
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
                <video src={exp.url} controls loop autoPlay muted playsInline className="result-video" />
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
                    Trình duyệt này chưa hỗ trợ xuất MP4 nên video ở dạng WebM (nhiều TV không đọc được). Hãy mở bằng
                    Chrome hoặc Edge bản mới để có MP4.
                  </p>
                ) : (
                  <details className="tv-guide" open>
                    <summary>Cách chiếu lên TV</summary>
                    <ol>
                      <li>Chép file .mp4 vào USB (định dạng FAT32 hoặc exFAT).</li>
                      <li>Cắm USB vào TV → mở ứng dụng Media / Trình phát video / USB.</li>
                      <li>
                        Chọn video, bật <strong>Lặp lại (Repeat)</strong> trong menu tuỳ chọn. TV không có chế độ này thì
                        xuất bản 5 phút.
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
