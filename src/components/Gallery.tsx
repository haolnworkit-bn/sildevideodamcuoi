"use client";

import Link from "next/link";
import { useState } from "react";
import { FEATURES } from "@/config/features";
import { EVENT_LIST, type EventTypeId } from "@/lib/events";
import { TEMPLATES } from "@/lib/render/templates";
import TemplateThumb from "./TemplateThumb";

export default function Gallery() {
  const [ev, setEv] = useState<EventTypeId>("dam-ngo");
  return (
    <section className="gallery">
      <div className="chips center">
        {EVENT_LIST.map((e) => (
          <button key={e.id} className={`chip ${ev === e.id ? "on" : ""}`} onClick={() => setEv(e.id)}>
            {e.label}
          </button>
        ))}
      </div>
      <div className="gallery-grid">
        {TEMPLATES.map((t) => (
          <Link key={t.id} href={`/editor?template=${t.id}&event=${ev}`} className="card">
            <TemplateThumb template={t} eventType={ev} at={2.5} />
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
      <p className="hint center">Rê chuột lên mẫu để xem chuyển động</p>
    </section>
  );
}
