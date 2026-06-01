"use client";

// Radar timeline: play/pause, a scrubber across past + nowcast frames, an
// on/off toggle, and an opacity control. Presentational; playback state lives in
// the dashboard so the map and this bar stay in sync.

import { Play, Pause, Broadcast } from "@phosphor-icons/react";
import type { RadarFrame } from "@/lib/types";

function frameTime(f: RadarFrame | undefined): string {
  if (!f) return "--:--";
  return new Date(f.time * 1000).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RadarControls({
  frames,
  index,
  playing,
  visible,
  opacity,
  onIndex,
  onPlayToggle,
  onVisibleToggle,
  onOpacity,
}: {
  frames: RadarFrame[];
  index: number;
  playing: boolean;
  visible: boolean;
  opacity: number;
  onIndex: (i: number) => void;
  onPlayToggle: () => void;
  onVisibleToggle: () => void;
  onOpacity: (v: number) => void;
}) {
  const current = frames[index];
  const isNowcast = current?.kind === "nowcast";
  const disabled = frames.length === 0;

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/90 px-3 py-2 shadow-2xl backdrop-blur">
      {/* Radar on/off */}
      <button
        onClick={onVisibleToggle}
        aria-pressed={visible}
        title={visible ? "Hide radar" : "Show radar"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          visible
            ? "border-storm-500/40 bg-storm-500/15 text-storm-400"
            : "border-white/10 text-slate-400 hover:text-slate-200"
        }`}
      >
        <Broadcast size={18} weight={visible ? "fill" : "regular"} />
      </button>

      {/* Play / pause */}
      <button
        onClick={onPlayToggle}
        disabled={disabled || !visible}
        aria-label={playing ? "Pause radar" : "Play radar"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-storm-400 text-ink-950 transition-transform hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
      >
        {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
      </button>

      {/* Scrubber */}
      <div className="flex min-w-[160px] flex-1 flex-col gap-0.5 sm:min-w-[220px]">
        <input
          type="range"
          min={0}
          max={Math.max(frames.length - 1, 0)}
          value={index}
          onChange={(e) => onIndex(Number(e.target.value))}
          disabled={disabled || !visible}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-600 accent-storm-400 disabled:opacity-40"
          aria-label="Radar timeline"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="tabular-nums">{frameTime(current)}</span>
          <span
            className={isNowcast ? "text-storm-400" : "text-slate-500"}
          >
            {disabled ? "no radar" : isNowcast ? "forecast" : "observed"}
          </span>
        </div>
      </div>

      {/* Opacity */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="text-[11px] text-slate-500">opacity</span>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => onOpacity(Number(e.target.value))}
          disabled={disabled || !visible}
          className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-ink-600 accent-storm-400 disabled:opacity-40"
          aria-label="Radar opacity"
        />
      </div>
    </div>
  );
}
