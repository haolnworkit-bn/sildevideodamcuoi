"use client";

import { useEffect, useState } from "react";
import { sceneSnapTime } from "@/components/PreviewPlayer";
import { BODY_FONTS, FONT_LIB, TITLE_FONTS, ensureFontsLoaded } from "@/lib/fonts";
import { createDefaultProject, type Aspect, type ProjectData } from "@/lib/project";
import { renderFrame, stageOf, timelineOf } from "@/lib/render/engine";
import { auditProbe, createProbe, type LayoutIssue } from "@/lib/render/layout";
import { TEMPLATES } from "@/lib/render/templates";
import type { Photo } from "@/lib/render/types";

/**
 * Kiểm tra bố cục chữ tự động: mọi mẫu × 2 tỉ lệ × số ảnh × bên ảnh × bộ tên (× font nếu chọn).
 * Mỗi cảnh được vẽ ở thời điểm "chụp" với probe bật; layout.ts báo chữ tràn vùng an toàn,
 * chữ nhỏ hơn ngưỡng đọc TV, chữ đè chữ, chữ đè khung ảnh.
 *
 * Tham số: ?t=id,id  &aspect=16:9|9:16  &names=default,long,xlong  &fonts=all  &bfonts=all
 * Kết quả JSON trong #result (dòng đầu "RESULT"), đọc bằng scripts/probe-export.mjs.
 */

const NAME_SETS: Record<string, Partial<ProjectData>> = {
  default: {},
  long: {
    groomName: "Nguyễn Hoàng Phương Nam",
    brideName: "Trần Ngọc Thanh Hương",
    nameStyle: "full",
    venue: "Nhà hàng Hoàng Gia, 123 Nguyễn Văn Linh, Quận 7",
  },
  xlong: {
    groomName: "Tôn Thất Hoàng Bảo Nguyên Khang",
    brideName: "Công Tôn Nữ Ỷ Lan Huyền Trang",
    nameStyle: "full",
    eventType: "thanh-hon",
    greeting: "Trân trọng kính mời quý khách tới dự",
    venue: "Trung tâm Hội nghị Tiệc cưới Bạch Dương, 194 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh",
  },
};

function fakePhoto(hue: number, portrait: boolean): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = portrait ? 1200 : 1600;
  c.height = portrait ? 1600 : 1000;
  const x = c.getContext("2d")!;
  x.fillStyle = `hsl(${hue},45%,62%)`;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

interface Group {
  template: string;
  aspect: Aspect;
  scene: string;
  kind: LayoutIssue["kind"];
  count: number;
  example: string;
  combo: string;
}

export default function LayoutAudit() {
  const [status, setStatus] = useState("đang chạy…");
  const [result, setResult] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const only = q.get("t")?.split(",");
    const aspects = (q.get("aspect")?.split(",") ?? ["16:9", "9:16"]) as Aspect[];
    const nameKeys = q.get("names")?.split(",") ?? Object.keys(NAME_SETS);
    const titleFonts = q.get("fonts") === "all" ? TITLE_FONTS.map((f) => f.key) : [undefined];
    const bodyFonts = q.get("bfonts") === "all" ? BODY_FONTS.map((f) => f.key) : [undefined];
    const photosFor: Record<string, Photo[]> = {};
    for (const n of [0, 1, 3]) photosFor[n] = [0, 120, 220].slice(0, n).map((h, i) => ({ img: fakePhoto(h, i !== 1), focusY: 0.4 }));

    (async () => {
      await ensureFontsLoaded([...TITLE_FONTS.map((f) => f.key), ...BODY_FONTS.map((f) => f.key)]);
      const groups = new Map<string, Group>();
      let renders = 0;
      let combos = 0;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      for (const tpl of TEMPLATES.filter((t) => !only || only.includes(t.id))) {
        setStatus(`${tpl.id}…`);
        await new Promise((r) => setTimeout(r));
        for (const aspect of aspects)
          for (const nk of nameKeys)
            for (const nPhotos of [0, 1, 3])
              for (const side of nPhotos && aspect === "16:9" ? (["left", "right"] as const) : (["left"] as const))
                for (const tf of titleFonts)
                  for (const bf of bodyFonts) {
                    const base = createDefaultProject(tpl.id, "an-hoi");
                    const data: ProjectData = {
                      ...base,
                      date: "2026-12-20",
                      aspect,
                      photoSide: side,
                      ...NAME_SETS[nk],
                      style: { ...(tf ? { titleFont: tf } : {}), ...(bf ? { bodyFont: bf } : {}) },
                    };
                    const photos = photosFor[nPhotos];
                    const { W, H } = stageOf(data);
                    canvas.width = W;
                    canvas.height = H;
                    const tl = timelineOf({ data, photos });
                    const combo = `${nk} · ${nPhotos} ảnh${nPhotos ? ` ${side}` : ""}${tf ? ` · ${tf}` : ""}${bf ? ` · ${bf}` : ""}`;
                    combos++;
                    for (const s of tl.scenes) {
                      const probe = createProbe();
                      renderFrame(ctx, sceneSnapTime(s), { template: tpl, data, photos, fonts: FONT_LIB, watermark: null, probe }, tl);
                      renders++;
                      for (const iss of auditProbe(probe, W, H)) {
                        const key = `${tpl.id}|${aspect}|${iss.scene}|${iss.kind}|${iss.detail.split(" ")[0]}`;
                        const g = groups.get(key);
                        if (g) g.count++;
                        else groups.set(key, { template: tpl.id, aspect, scene: iss.scene, kind: iss.kind, count: 1, example: iss.detail, combo });
                      }
                    }
                  }
      }
      const list = [...groups.values()].sort((a, b) => a.template.localeCompare(b.template) || a.aspect.localeCompare(b.aspect));
      const byKind: Record<string, number> = {};
      for (const g of list) byKind[g.kind] = (byKind[g.kind] ?? 0) + g.count;
      setStatus("xong");
      setResult(`RESULT ${JSON.stringify({ combos, renders, byKind, groups: list.length, issues: list })}`);
    })().catch((e) => setResult(`RESULT ${JSON.stringify({ error: String(e) })}`));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>Kiểm tra bố cục chữ — {status}</h3>
      <pre id="result" style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
        {result}
      </pre>
    </div>
  );
}
