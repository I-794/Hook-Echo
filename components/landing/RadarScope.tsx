// The hero's live radar scope. This is the product's own visual language (a radar
// PPI display), not decorative filler: concentric range rings, a continuous sweep,
// and a few "returns" lighting up. Pure CSS so it ships as a Server Component; the
// sweep + pulse honor prefers-reduced-motion via the global reduce rule.

export function RadarScope({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square w-full max-w-[460px] ${className}`}
      aria-hidden="true"
    >
      {/* Outer bezel */}
      <div className="absolute inset-0 rounded-full border border-storm-500/20 bg-ink-900/60 shadow-[inset_0_0_80px_rgba(56,225,255,0.06),0_30px_80px_-20px_rgba(0,0,0,0.8)]" />

      {/* Range rings */}
      {[0.78, 0.56, 0.34, 0.14].map((scale) => (
        <div
          key={scale}
          className="absolute left-1/2 top-1/2 rounded-full border border-storm-500/15"
          style={{
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Crosshair */}
      <div className="absolute left-1/2 top-[8%] h-[84%] w-px -translate-x-1/2 bg-storm-500/10" />
      <div className="absolute top-1/2 left-[8%] h-px w-[84%] -translate-y-1/2 bg-storm-500/10" />

      {/* Sweep */}
      <div className="absolute inset-[6%] overflow-hidden rounded-full">
        <div
          className="absolute inset-0 animate-sweep"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(56,225,255,0) 0deg, rgba(56,225,255,0) 300deg, rgba(56,225,255,0.05) 340deg, rgba(56,225,255,0.35) 360deg)",
          }}
        />
      </div>

      {/* Returns / blips */}
      <span className="absolute left-[62%] top-[40%] h-2.5 w-2.5 rounded-full bg-storm-400 shadow-[0_0_14px_4px_rgba(56,225,255,0.5)]" />
      <span className="absolute left-[40%] top-[58%] h-2 w-2 rounded-full bg-storm-400/80 shadow-[0_0_10px_3px_rgba(56,225,255,0.4)]" />
      {/* A severe cell, in warning red, slowly pulsing */}
      <span className="absolute left-[55%] top-[63%] h-3.5 w-3.5 animate-pulse-ring rounded-full bg-warn-tornado shadow-[0_0_16px_4px_rgba(255,46,99,0.55)]" />

      {/* Center origin */}
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-storm-400" />
    </div>
  );
}
