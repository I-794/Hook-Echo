// Dynamic social-share card (1200x630). Next.js wires this up as og:image and
// (via twitter-image fallback) twitter:image, so links unfurl with a branded
// preview in Discord, Slack, iMessage, and X. Rendered with Satori at request
// time using default fonts (no external font fetch, keeps it reliable).

import { ImageResponse } from "next/og";

export const alt = "Hook Echo - Severe Weather Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const cyan = "#38e1ff";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#05070d",
          backgroundImage:
            "radial-gradient(900px 500px at 78% -10%, rgba(56,225,255,0.18), transparent)",
          padding: "72px",
          fontFamily: "sans-serif",
          color: "#e2e8f0",
          position: "relative",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13.2" stroke={cyan} strokeOpacity="0.3" strokeWidth="1.4" />
            <circle cx="16" cy="16" r="8" stroke={cyan} strokeOpacity="0.2" strokeWidth="1.2" />
            <path
              d="M16 5.5 C 23.2 5.5 27 11 25.6 17 C 24.6 21.4 20.6 24 16.4 23.2 C 13.4 22.6 11.6 20 12 17.2 C 12.3 15.2 14 13.9 15.9 14.2 C 17.2 14.4 18 15.5 17.8 16.7"
              stroke={cyan}
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="16" cy="16" r="1.7" fill={cyan} />
          </svg>
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 700 }}>
            <span style={{ color: "#f1f5f9" }}>Hook</span>
            <span style={{ color: cyan }}>&nbsp;Echo</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "900px",
              color: "#ffffff",
            }}
          >
            Every warning, the second it is issued.
          </div>
          <div style={{ fontSize: "30px", color: "#94a3b8", maxWidth: "880px" }}>
            Live NWS alerts. Animated radar. Near-me notifications.
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "24px",
            color: "#64748b",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "999px",
              background: "#ff2e63",
            }}
          />
          Severe weather dashboard for the United States
        </div>
      </div>
    ),
    { ...size },
  );
}
