"use client";

// Detail panel for a single selected alert: headline, area, timing, the full
// description and call-to-action instruction. Slides in from the side on desktop
// and up from the bottom on mobile.

import { X, Clock, MapPin, WarningOctagon } from "@phosphor-icons/react";
import { styleForEvent, expiryLabel } from "@/lib/alerts";
import type { NwsAlertFeature } from "@/lib/types";

function fmt(dt: string | null): string {
  if (!dt) return "";
  const t = Date.parse(dt);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AlertPanel({
  feature,
  onClose,
}: {
  feature: NwsAlertFeature | null;
  onClose: () => void;
}) {
  if (!feature) return null;
  const p = feature.properties;
  const style = styleForEvent(p.event);

  return (
    <div className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur md:w-[380px]">
      {/* Header */}
      <div
        className="relative px-5 py-4"
        style={{ boxShadow: `inset 4px 0 0 ${style.color}` }}
      >
        <button
          onClick={onClose}
          aria-label="Close alert"
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: style.color }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: style.color }}
          >
            {p.event}
          </span>
        </div>
        <h2 className="mt-1.5 pr-6 text-[15px] font-semibold leading-snug text-slate-50">
          {p.headline ?? p.event}
        </h2>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-b border-white/5 px-5 py-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={14} /> {p.areaDesc}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} /> {expiryLabel(p.expires)}
        </span>
      </div>

      {/* Severity badges */}
      <div className="flex flex-wrap gap-2 px-5 pt-3 text-[11px]">
        {[
          { k: "Severity", v: p.severity },
          { k: "Certainty", v: p.certainty },
          { k: "Urgency", v: p.urgency },
        ].map((b) => (
          <span
            key={b.k}
            className="rounded-full border border-white/10 bg-ink-800/60 px-2.5 py-1 text-slate-300"
          >
            {b.k}: <span className="text-slate-100">{b.v}</span>
          </span>
        ))}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-300">
        {p.description && (
          <p className="whitespace-pre-line">{p.description}</p>
        )}
        {p.instruction && (
          <div className="rounded-xl border border-warn-watch/25 bg-warn-watch/[0.06] p-3.5">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warn-watch">
              <WarningOctagon size={14} weight="fill" /> What to do
            </div>
            <p className="whitespace-pre-line text-slate-200">
              {p.instruction}
            </p>
          </div>
        )}
        <p className="pt-1 text-xs text-slate-500">
          Issued by {p.senderName}. Expires {fmt(p.expires)}.
        </p>
      </div>
    </div>
  );
}
