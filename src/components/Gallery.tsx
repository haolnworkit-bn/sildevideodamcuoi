"use client";

import Link from "next/link";
import { useState } from "react";
import { FEATURES } from "@/config/features";
import { EVENT_LIST, type EventTypeId } from "@/lib/events";
import { COLOR_TAGS, TEMPLATES } from "@/lib/render/templates";
import type { ColorTag } from "@/lib/render/types";
import TemplateThumb from "./TemplateThumb";

export default function Gallery() {
  const [ev, setEv] = useState<EventTypeId>("dam-ngo");
  const [color, setColor] = useState<ColorTag | null>(null);
  const list = color ? TEMPLATES.filter((t) => t.colors.includes(color)) : TEMPLATES;
  return (
    <section className="gallery">
      <div className="chips center">
        {EVENT_LIST.map((e) => (
          <button key={e.id} className={`chip ${ev === e.id ? "on" : ""}`} onClick={() => setEv(e.id)}>
            {e.label}
          </button>
        ))}
      </div>
      <div className="chips center" style={{ marginTop: 10 }}>
        <span className="hint">Màu rạp:</span>
        <button className={`chip small ${!color ? "on" : ""}`} onClick={() => setColor(null)}>
          Tất cả
        </button>
        {COLOR_TAGS.map((c) => (
          <button key={c.id} className={`chip small ${color === c.id ? "on" : ""}`} onClick={() => setColor(c.id)}>
            <i className="dot" style={{ background: c.dot }} /> {c.label}
          </button>
        ))}
      </div>
      <div className="gallery-grid">
        {list.map((t) => (
          <Link key={t.id} href={`/editor?template=${t.id}&event=${ev}`} className="card">
            <TemplateThumb template={t} eventType={ev} />
            <div className="card-body">
              <strong>
                {t.name}
                {FEATURES.monetization && t.tier === "premium" && <em className="badge">Premium</em>}
              </strong>
              <span>{t.description}</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="hint center">Rê chuột lên mẫu để xem chuyển động · Mẫu nào cũng có bản ngang 16:9 và dọc 9:16</p>
    </section>
  );
}
