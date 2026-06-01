// Hook Echo landing page (storm-ops aesthetic). Server Component; the only
// interactive/motion pieces are isolated client leaves (Reveal) and pure-CSS
// visuals (RadarScope). Accent is locked to storm cyan; the warning colors
// appear only where they carry real meaning (the alert color system / blips).

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Broadcast,
  CloudLightning,
  MagnifyingGlass,
  NavigationArrow,
  ShieldWarning,
  SpeakerHigh,
  Tornado,
  Waves,
} from "@phosphor-icons/react/dist/ssr";
import { Logo, LogoMark } from "@/components/Logo";
import { RadarScope } from "@/components/landing/RadarScope";
import { Reveal } from "@/components/landing/Reveal";

const ALERT_LEGEND: Array<{
  label: string;
  color: string;
  emphatic?: boolean;
}> = [
  { label: "Tornado Warning", color: "#ff2e63", emphatic: true },
  { label: "Severe T-Storm Warning", color: "#ff7b29", emphatic: true },
  { label: "Flash Flood Warning", color: "#22c55e" },
  { label: "Tornado Watch", color: "#ffd23f" },
  { label: "Winter Storm Warning", color: "#818cf8" },
  { label: "High Wind Warning", color: "#fb923c" },
  { label: "Flood Advisory", color: "#34d399" },
  { label: "Special Weather Statement", color: "#94a3b8" },
];

const STEPS = [
  {
    title: "Drop a point",
    body: "Use your location, search any US city or ZIP, or just pan the map. Hook Echo loads what is active there.",
    icon: NavigationArrow,
  },
  {
    title: "Watch it move",
    body: "Animated radar runs over color-coded warning polygons so you can see the cells and the threat together.",
    icon: Broadcast,
  },
  {
    title: "Get the warning",
    body: "When a new warning fires for your saved spot, the browser notifies you. Flip on the alarm if you want sound.",
    icon: Bell,
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-ink-950 text-slate-100">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-storm-500/10 blur-[120px]" />

      {/* Nav */}
      <header className="relative z-20">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Hook Echo home">
            <Logo />
          </Link>
          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#system" className="transition-colors hover:text-storm-400">
              Alert system
            </a>
            <a href="#features" className="transition-colors hover:text-storm-400">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-storm-400">
              How it works
            </a>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full bg-storm-400 px-4 py-2 text-sm font-semibold text-ink-950 transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Launch dashboard
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:pt-16">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-storm-500/25 bg-storm-500/10 px-3 py-1 text-xs font-medium text-storm-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-storm-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-storm-400" />
            </span>
            Live NWS feed
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Every warning, the second it is issued.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            Live National Weather Service alerts, animated radar, and severe-weather
            notifications for any location in the United States.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-storm-400 px-6 py-3 text-sm font-semibold text-ink-950 transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Launch dashboard
              <ArrowRight
                size={18}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-storm-500/40 hover:text-white"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:col-span-5 lg:justify-end">
          <RadarScope />
        </div>
      </section>

      {/* Alert color system */}
      <section
        id="system"
        className="relative z-10 border-t border-white/5 bg-ink-900/40"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-storm-400">
              Alert system
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Color-coded the way the warnings rank.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-400">
              Tornado and severe thunderstorm warnings are styled loudest, so the
              most dangerous polygons read first at any zoom level.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ALERT_LEGEND.map((a, i) => (
              <Reveal key={a.label} delay={i * 40}>
                <div
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ink-800/60 px-4 py-3.5"
                  style={{ boxShadow: `inset 3px 0 0 ${a.color}` }}
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${a.emphatic ? "animate-pulse-ring" : ""}`}
                    style={{ background: a.color }}
                  />
                  <span className="text-sm text-slate-200">{a.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              A storm room in your browser tab.
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Large feature: live alert map */}
            <Reveal className="md:col-span-2" delay={0}>
              <article className="relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-ink-800/80 to-ink-900/80 p-7">
                <div className="pointer-events-none absolute -right-16 -top-16 opacity-30">
                  <RadarScope className="!w-[280px]" />
                </div>
                <ShieldWarning size={30} weight="duotone" className="text-storm-400" />
                <div className="relative mt-8 max-w-md">
                  <h3 className="text-xl font-semibold">Live warning polygons</h3>
                  <p className="mt-2 text-slate-400">
                    Every active NWS alert drawn on a full-screen map. Click a
                    polygon for the full headline, instructions, and expiration.
                  </p>
                </div>
              </article>
            </Reveal>

            {/* Animated radar */}
            <Reveal delay={80}>
              <article className="flex h-full min-h-[260px] flex-col justify-between rounded-2xl border border-white/5 bg-ink-800/60 p-7">
                <Broadcast size={30} weight="duotone" className="text-storm-400" />
                <div>
                  <h3 className="text-xl font-semibold">Animated radar</h3>
                  <p className="mt-2 text-slate-400">
                    RainViewer frames with a timeline scrubber and play / pause to
                    run the loop forward.
                  </p>
                </div>
              </article>
            </Reveal>

            {/* Near-me notifications */}
            <Reveal delay={120}>
              <article className="flex h-full min-h-[240px] flex-col justify-between rounded-2xl border border-warn-tornado/20 bg-warn-tornado/[0.06] p-7">
                <Bell size={30} weight="duotone" className="text-warn-tornado" />
                <div>
                  <h3 className="text-xl font-semibold">Notifications nearby</h3>
                  <p className="mt-2 text-slate-400">
                    A new warning for your saved point fires a browser notification,
                    with an optional audio alarm.
                  </p>
                </div>
              </article>
            </Reveal>

            {/* Geolocate + search */}
            <Reveal className="md:col-span-2" delay={160}>
              <article className="flex h-full min-h-[240px] flex-col justify-between rounded-2xl border border-white/5 bg-ink-800/60 p-7">
                <div className="flex gap-3">
                  <NavigationArrow size={28} weight="duotone" className="text-storm-400" />
                  <MagnifyingGlass size={28} weight="duotone" className="text-storm-400" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-semibold">Anywhere in the US</h3>
                  <p className="mt-2 text-slate-400">
                    Jump to your location in one tap or search any city, town, or ZIP.
                    Alerts and conditions reload for that point automatically.
                  </p>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 border-t border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-storm-400">
              How it works
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Point, watch, get warned.
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i * 90}>
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-storm-500/30 bg-storm-500/10">
                      <Icon size={24} weight="duotone" className="text-storm-400" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-slate-400">{s.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <Reveal>
            <div className="flex flex-col gap-8 rounded-2xl border border-white/5 bg-ink-800/40 p-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-md">
                <h2 className="text-2xl font-bold tracking-tight">
                  Built on official data.
                </h2>
                <p className="mt-2 text-slate-400">
                  Warnings come straight from the National Weather Service. Radar
                  imagery comes from RainViewer. No middleman forecasts.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-900/60 px-4 py-3">
                  <Tornado size={26} weight="duotone" className="text-warn-tornado" />
                  <div>
                    <p className="text-sm font-semibold">NWS</p>
                    <p className="text-xs text-slate-500">api.weather.gov</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-900/60 px-4 py-3">
                  <CloudLightning size={26} weight="duotone" className="text-storm-400" />
                  <div>
                    <p className="text-sm font-semibold">RainViewer</p>
                    <p className="text-xs text-slate-500">live radar tiles</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-storm-500/20 bg-gradient-to-br from-storm-500/15 via-ink-900 to-ink-900 px-8 py-16 text-center">
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
              <div className="relative">
                <Waves size={32} weight="duotone" className="mx-auto text-storm-400" />
                <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Open the map when the sky turns.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-slate-400">
                  No account, no setup. Pick a location and start watching.
                </p>
                <Link
                  href="/dashboard"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-storm-400 px-7 py-3.5 text-sm font-semibold text-ink-950 transition-transform hover:-translate-y-px active:translate-y-0"
                >
                  Launch dashboard
                  <ArrowRight
                    size={18}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark size={22} className="text-storm-400" />
            <span className="text-sm text-slate-400">
              Hook Echo. A severe weather dashboard.
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <SpeakerHigh size={14} weight="fill" className="text-slate-600" />
            Data: NWS and RainViewer. Always follow official guidance.
          </div>
        </div>
      </footer>
    </main>
  );
}
