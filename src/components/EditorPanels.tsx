"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FEATURES } from "@/config/features";
import { EVENT_LIST, EVENT_TYPES, type EventTypeId } from "@/lib/events";
import { BODY_FONTS, FONT_LIB, TITLE_FONTS, ensureFontsLoaded } from "@/lib/fonts";
import { MUSIC_LIBRARY, buildLibraryTrack } from "@/lib/musicLibrary";
import { MAX_PHOTOS, dateInfo, givenName, type ProjectData, type StyleOverrides } from "@/lib/project";
import { checkMessageFit } from "@/lib/render/engine";
import { COLOR_TAGS, TEMPLATES, getTemplate } from "@/lib/render/templates";
import type { ColorTag, Photo } from "@/lib/render/types";
import TemplateThumb from "./TemplateThumb";

export type Patch = (p: Partial<ProjectData>) => void;

/** Đổi loại lễ; nếu đang dùng lời cảm ơn mẫu thì đổi luôn sang lời mẫu của loại mới */
export function switchEvent(d: ProjectData, ev: EventTypeId): ProjectData {
  if (d.eventType === ev) return d;
  const usingDefault = d.message.trim() === EVENT_TYPES[d.eventType].defaultMessage;
  return { ...d, eventType: ev, message: usingDefault ? EVENT_TYPES[ev].defaultMessage : d.message };
}

// ---------------------------------------------------------------- Mẫu

export function TemplatesPanel({ data, patch, photos }: { data: ProjectData; patch: Patch; photos: Photo[] }) {
  const [color, setColor] = useState<ColorTag | null>(null);
  const list = color ? TEMPLATES.filter((t) => t.colors.includes(color)) : TEMPLATES;
  return (
    <>
      <section className="field-group">
        <h3>Màu trang trí rạp</h3>
        <div className="chips">
          <button className={`chip ${!color ? "on" : ""}`} onClick={() => setColor(null)}>
            Tất cả ({TEMPLATES.length})
          </button>
          {COLOR_TAGS.map((c) => (
            <button key={c.id} className={`chip ${color === c.id ? "on" : ""}`} onClick={() => setColor(c.id)}>
              <i className="dot" style={{ background: c.dot }} /> {c.label}
            </button>
          ))}
        </div>
        <p className="hint">Chọn mẫu khác thì nội dung, ảnh và tuỳ chỉnh vẫn được giữ nguyên.</p>
      </section>
      <section className="field-group">
        <div className="tpl-grid">
          {list.map((t) => (
            <button
              key={t.id}
              className={`tpl-pick ${t.id === data.templateId ? "on" : ""}`}
              onClick={() => patch({ templateId: t.id })}
              title={t.description}
            >
              <TemplateThumb template={t} eventType={data.eventType} data={data} photos={photos.slice(0, 1)} />
              <span>
                {t.name}
                {FEATURES.monetization && t.tier === "premium" && <em className="badge">Premium</em>}
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Nội dung

export function ContentPanel({ data, patch, setData, photoCount }: { data: ProjectData; patch: Patch; setData: (d: ProjectData) => void; photoCount: number }) {
  const info = dateInfo(data);
  // Đo lời cảm ơn bằng đúng font của mẫu (đợi font tải xong để đo chính xác)
  const [fontsReady, setFontsReady] = useState(0);
  useEffect(() => {
    let alive = true;
    ensureFontsLoaded([data.style.titleFont, data.style.bodyFont]).then(() => alive && setFontsReady((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [data.style.titleFont, data.style.bodyFont]);
  const messageFit = useMemo(
    () => checkMessageFit({ template: getTemplate(data.templateId), data, fonts: FONT_LIB }),
    [data.message, data.aspect, data.templateId, data.style, fontsReady],
  );
  return (
    <>
      <section className="field-group">
        <h3>Loại lễ</h3>
        <div className="chips">
          {EVENT_LIST.map((e) => (
            <button key={e.id} className={`chip ${data.eventType === e.id ? "on" : ""}`} onClick={() => setData(switchEvent(data, e.id))}>
              {e.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Tiêu đề hiển thị</span>
          <input value={data.title} placeholder={EVENT_TYPES[data.eventType].title} onChange={(e) => patch({ title: e.target.value })} />
        </label>
        <label className="field">
          <span>Lời chào mở đầu</span>
          <input value={data.greeting} placeholder="Để trống nếu không muốn hiện" onChange={(e) => patch({ greeting: e.target.value })} />
        </label>
      </section>

      <section className="field-group">
        <h3>Cô dâu & chú rể</h3>
        <label className="field">
          <span>Họ tên chú rể</span>
          <input value={data.groomName} onChange={(e) => patch({ groomName: e.target.value })} />
        </label>
        <label className="field">
          <span>Họ tên cô dâu</span>
          <input value={data.brideName} onChange={(e) => patch({ brideName: e.target.value })} />
        </label>
        <div className="row even">
          <label className="field">
            <span>Tên ở cảnh lớn</span>
            <select value={data.nameStyle} onChange={(e) => patch({ nameStyle: e.target.value as ProjectData["nameStyle"] })}>
              <option value="short">
                {givenName(data.groomName)} & {givenName(data.brideName)}
              </option>
              <option value="full">Họ tên đầy đủ</option>
            </select>
          </label>
          <label className="field">
            <span>Thứ tự</span>
            <select value={data.nameOrder} onChange={(e) => patch({ nameOrder: e.target.value as ProjectData["nameOrder"] })}>
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
            <input type="date" value={data.date} onChange={(e) => patch({ date: e.target.value })} />
          </label>
          <label className="field">
            <span>Giờ</span>
            <input type="time" value={data.time} onChange={(e) => patch({ time: e.target.value })} />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={data.showLunar} onChange={(e) => patch({ showLunar: e.target.checked })} />
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
          <input value={data.venue} placeholder="VD: Tư gia nhà gái" onChange={(e) => patch({ venue: e.target.value })} />
        </label>
      </section>

      <section className="field-group">
        <h3>Lời cảm ơn</h3>
        <label className="field">
          <textarea rows={4} value={data.message} maxLength={320} onChange={(e) => patch({ message: e.target.value })} />
          <small className="hint">{data.message.length}/320 ký tự</small>
        </label>
        {data.scenes.message && messageFit?.overflow && (
          <p className="warn">
            Lời cảm ơn quá dài với khung {data.aspect === "9:16" ? "dọc" : "ngang"}: chữ đã thu nhỏ hết mức mà vẫn không vừa,
            phần cuối sẽ bị rút gọn thành "…". Hãy bớt chữ hoặc bớt xuống dòng.
          </p>
        )}
        <button className="link" onClick={() => patch({ message: EVENT_TYPES[data.eventType].defaultMessage })}>
          Dùng lời mẫu
        </button>
      </section>

      <section className="field-group">
        <h3>Các cảnh trong video</h3>
        <label className="check">
          <input type="checkbox" checked disabled />
          <span>Giới thiệu · Tên & ngày lễ (luôn có)</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={data.scenes.message} onChange={(e) => patch({ scenes: { ...data.scenes, message: e.target.checked } })} />
          <span>Lời cảm ơn</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={data.scenes.album}
            onChange={(e) => patch({ scenes: { ...data.scenes, album: e.target.checked } })}
          />
          <span>
            Khoảnh khắc (trình chiếu ảnh)
            {photoCount < 2 && <small> — cần từ 2 ảnh, vào thẻ Ảnh để thêm</small>}
          </span>
        </label>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Ảnh

export function PhotosPanel({
  data,
  patch,
  photos,
  onAdd,
  onRemove,
  onMakeMain,
  busy,
}: {
  data: ProjectData;
  patch: Patch;
  photos: Array<Photo & { id: string; url: string }>;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onMakeMain: (id: string) => void;
  busy: boolean;
}) {
  const left = MAX_PHOTOS - photos.length;
  return (
    <>
      <section className="field-group">
        <h3>
          Ảnh cặp đôi ({photos.length}/{MAX_PHOTOS})
        </h3>
        <p className="hint">
          Ảnh đầu tiên là ảnh chính (cảnh mở đầu & cảnh tên). Từ 2 ảnh trở lên có thêm cảnh <strong>Khoảnh khắc</strong> trình chiếu lần
          lượt.
        </p>
        {left > 0 && (
          <label className={`upload ${busy ? "busy" : ""}`}>
            <input type="file" accept="image/*" multiple onChange={(e) => onAdd(Array.from(e.target.files ?? []).slice(0, left))} />
            {busy ? "Đang xử lý ảnh…" : photos.length ? `+ Thêm ảnh (còn ${left})` : "Chọn ảnh (có thể chọn nhiều)"}
          </label>
        )}
        <div className="photo-list">
          {photos.map((p, i) => (
            <div key={p.id} className="photo-item">
              <div className="photo-thumb" style={{ backgroundImage: `url(${p.url})`, backgroundPositionY: `${p.focusY * 100}%` }}>
                {i === 0 && <em className="badge main">Ảnh chính</em>}
              </div>
              <div className="photo-ctl">
                <label className="field">
                  <span>Căn dọc</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={p.focusY}
                    onChange={(e) =>
                      patch({ photos: data.photos.map((m) => (m.id === p.id ? { ...m, focusY: Number(e.target.value) } : m)) })
                    }
                  />
                </label>
                <div className="photo-actions">
                  {i > 0 && (
                    <button className="link" onClick={() => onMakeMain(p.id)}>
                      Đặt làm ảnh chính
                    </button>
                  )}
                  <button className="link danger" onClick={() => onRemove(p.id)}>
                    Xoá
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="field-group">
        <h3>Vị trí ảnh (khung ngang)</h3>
        <div className="segmented">
          {(["left", "right"] as const).map((s) => (
            <button key={s} className={data.photoSide === s ? "on" : ""} onClick={() => patch({ photoSide: s })}>
              {s === "left" ? "Ảnh bên trái" : "Ảnh bên phải"}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Kiểu chữ & màu

const QUICK_COLORS = ["#9e1b32", "#b0385a", "#5b3a7a", "#2c4a73", "#1f5f5b", "#3f6b3a", "#8a3b12", "#a88a4e", "#3b3b3b", "#ffffff"];

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v?: string) => void }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="color-row">
        <label className={`color-swatch ${value ? "" : "auto"}`} style={value ? { background: value } : undefined}>
          <input type="color" value={value ?? "#888888"} onChange={(e) => onChange(e.target.value)} />
        </label>
        {QUICK_COLORS.map((c) => (
          <button key={c} className={`qc ${value === c ? "on" : ""}`} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />
        ))}
        {value && (
          <button className="link" onClick={() => onChange(undefined)}>
            Theo mẫu
          </button>
        )}
      </div>
    </div>
  );
}

export function StylePanel({ data, patch }: { data: ProjectData; patch: Patch }) {
  const st = data.style;
  const set = (p: Partial<StyleOverrides>) => {
    const next: StyleOverrides = { ...st, ...p };
    for (const k of Object.keys(next) as Array<keyof StyleOverrides>) if (!next[k]) delete next[k];
    patch({ style: next });
  };
  const titleFam = TITLE_FONTS.find((f) => f.key === st.titleFont)?.family;
  const bodyFam = BODY_FONTS.find((f) => f.key === st.bodyFont)?.family;
  const hasAny = Object.keys(st).length > 0;
  return (
    <>
      <section className="field-group">
        <h3>Font chữ</h3>
        <label className="field">
          <span>Tiêu đề & tên</span>
          <select value={st.titleFont ?? ""} onChange={(e) => set({ titleFont: e.target.value || undefined })}>
            <option value="">Theo mẫu</option>
            {TITLE_FONTS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <div className="font-preview" style={{ fontFamily: titleFam ?? "var(--font-script)", fontSize: 34 }}>
          {givenName(data.groomName)} & {givenName(data.brideName)}
        </div>
        <label className="field">
          <span>Lời nhắn & ngày tháng</span>
          <select value={st.bodyFont ?? ""} onChange={(e) => set({ bodyFont: e.target.value || undefined })}>
            <option value="">Theo mẫu</option>
            {BODY_FONTS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <div className="font-preview" style={{ fontFamily: bodyFam ?? "var(--font-serif)", fontStyle: "italic", fontSize: 18 }}>
          Trân trọng cảm ơn quý vị đã đến chung vui
        </div>
      </section>
      <section className="field-group">
        <h3>Màu chữ</h3>
        <p className="hint">Chỉnh cho hợp màu trang trí rạp. Để “Theo mẫu” nếu muốn giữ màu gốc (vd chữ vàng ánh kim).</p>
        <ColorField label="Tiêu đề & tên" value={st.headingColor} onChange={(v) => set({ headingColor: v })} />
        <ColorField label="Lời nhắn" value={st.textColor} onChange={(v) => set({ textColor: v })} />
        <ColorField label="Màu nhấn (lời chào, ngày, đường kẻ)" value={st.accentColor} onChange={(v) => set({ accentColor: v })} />
        {hasAny && (
          <button className="btn ghost" onClick={() => patch({ style: {} })}>
            Khôi phục kiểu chữ của mẫu
          </button>
        )}
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Hiệu ứng

export function FxPanel({ data, patch }: { data: ProjectData; patch: Patch }) {
  const fx = data.fx;
  const levels: Array<[number, string]> = [
    [0, "Tắt"],
    [0.5, "Ít"],
    [1, "Vừa"],
    [1.5, "Nhiều"],
  ];
  const trans: Array<[ProjectData["fx"]["transition"], string]> = [
    ["fade", "Mờ dần"],
    ["zoom", "Phóng nhẹ"],
    ["slide", "Trượt lên"],
  ];
  return (
    <>
      <section className="field-group">
        <h3>Hạt chuyển động</h3>
        <p className="hint">Cánh hoa rơi, lấp lánh, lá bay… tuỳ mẫu.</p>
        <div className="segmented">
          {levels.map(([v, l]) => (
            <button key={v} className={fx.particles === v ? "on" : ""} onClick={() => patch({ fx: { ...fx, particles: v } })}>
              {l}
            </button>
          ))}
        </div>
      </section>
      <section className="field-group">
        <h3>Chuyển cảnh</h3>
        <div className="segmented">
          {trans.map(([v, l]) => (
            <button key={v} className={fx.transition === v ? "on" : ""} onClick={() => patch({ fx: { ...fx, transition: v } })}>
              {l}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Nhạc nền

export function MusicPanel({
  data,
  patch,
  musicUrl,
  onUpload,
  onRemove,
}: {
  data: ProjectData;
  patch: Patch;
  musicUrl: string | null;
  onUpload: (f: File) => void;
  onRemove: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [building, setBuilding] = useState<string | null>(null);
  useEffect(() => {
    if (!musicUrl) return;
    const a = new Audio(musicUrl);
    a.loop = true;
    audioRef.current = a;
    a.onpause = () => setPlaying(false);
    a.onplay = () => setPlaying(true);
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [musicUrl]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = data.music.volume;
  }, [data.music.volume, musicUrl]);

  return (
    <section className="field-group">
      <h3>Nhạc nền</h3>
      <p className="hint">
        Nhạc phát khi <strong>Trình chiếu</strong> và được ghép vào file MP4. Video ngắn hơn bài nhạc thì nhạc sẽ chạy tiếp ở vòng sau khi
        trình chiếu; trong file MP4 nhạc lặp lại và mờ dần ở cuối. Hãy dùng bài nhạc bạn có quyền sử dụng.
      </p>
      {musicUrl ? (
        <>
          <div className="music-row">
            <button className="btn-icon" onClick={() => (playing ? audioRef.current?.pause() : audioRef.current?.play())}>
              {playing ? "❚❚" : "▶"}
            </button>
            <span className="music-name">{data.music.name || "Nhạc nền"}</span>
            <button className="link danger" onClick={onRemove}>
              Xoá
            </button>
          </div>
          <label className="check">
            <input type="checkbox" checked={data.music.enabled} onChange={(e) => patch({ music: { ...data.music, enabled: e.target.checked } })} />
            <span>Dùng nhạc này</span>
          </label>
          <label className="field">
            <span>Âm lượng {Math.round(data.music.volume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={data.music.volume}
              onChange={(e) => patch({ music: { ...data.music, volume: Number(e.target.value) } })}
            />
          </label>
        </>
      ) : (
        <>
          <label className="upload">
            <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            Chọn file nhạc (MP3, M4A, WAV…)
          </label>
          <h3 style={{ marginTop: 16 }}>Hoặc chọn nhạc có sẵn</h3>
          <p className="hint">Nhạc do ứng dụng tự tạo, dùng tự do, không lo bản quyền.</p>
          <div className="stack">
            {MUSIC_LIBRARY.map((tr) => (
              <button
                key={tr.id}
                className="lib-track"
                disabled={!!building}
                onClick={async () => {
                  setBuilding(tr.id);
                  try {
                    onUpload(await buildLibraryTrack(tr));
                  } finally {
                    setBuilding(null);
                  }
                }}
              >
                <strong>{building === tr.id ? "Đang tạo…" : `♪ ${tr.name}`}</strong>
                <small>{tr.description}</small>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
