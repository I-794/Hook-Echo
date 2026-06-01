"use client";

// Top toolbar: brand, location search, geolocation, manual refresh, and the
// notification + audio-alarm toggles. Stays on one row at desktop; on mobile the
// search drops to a second row.

import Link from "next/link";
import {
  NavigationArrow,
  ArrowsClockwise,
  Bell,
  BellSlash,
  SpeakerHigh,
  SpeakerSlash,
  List,
} from "@phosphor-icons/react";
import { Logo } from "@/components/Logo";
import { SearchBox } from "./SearchBox";

interface ToolbarProps {
  onPick: (lat: number, lon: number, label: string) => void;
  onGeolocate: () => void;
  onRefresh: () => void;
  onToggleSidebar: () => void;
  loading: boolean;
  geolocating: boolean;
  notifier: {
    supported: boolean;
    enabled: boolean;
    audio: boolean;
    permission: string;
    toggleEnabled: () => void;
    toggleAudio: () => void;
  };
}

export function Toolbar({
  onPick,
  onGeolocate,
  onRefresh,
  onToggleSidebar,
  loading,
  geolocating,
  notifier,
}: ToolbarProps) {
  const denied = notifier.permission === "denied";
  return (
    <header className="relative z-30 border-b border-white/5 bg-ink-900/80 backdrop-blur">
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <Link href="/" aria-label="Hook Echo home" className="shrink-0">
          <Logo className="hidden sm:inline-flex" />
          <Logo className="sm:hidden" markSize={26} />
        </Link>

        {/* Search: inline on desktop */}
        <div className="hidden max-w-md flex-1 md:block">
          <SearchBox onPick={onPick} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <IconButton
            label="Use my location"
            onClick={onGeolocate}
            active={false}
          >
            <NavigationArrow
              size={18}
              weight="fill"
              className={geolocating ? "animate-pulse" : ""}
            />
          </IconButton>

          <IconButton label="Refresh alerts" onClick={onRefresh}>
            <ArrowsClockwise
              size={18}
              className={loading ? "animate-spin" : ""}
            />
          </IconButton>

          <IconButton
            label={
              !notifier.supported
                ? "Notifications unsupported"
                : denied
                  ? "Notifications blocked in browser"
                  : notifier.enabled
                    ? "Disable notifications"
                    : "Enable notifications"
            }
            onClick={notifier.toggleEnabled}
            active={notifier.enabled}
            disabled={!notifier.supported || denied}
          >
            {notifier.enabled ? (
              <Bell size={18} weight="fill" />
            ) : (
              <BellSlash size={18} />
            )}
          </IconButton>

          <IconButton
            label={notifier.audio ? "Mute alarm" : "Enable audio alarm"}
            onClick={notifier.toggleAudio}
            active={notifier.audio}
          >
            {notifier.audio ? (
              <SpeakerHigh size={18} weight="fill" />
            ) : (
              <SpeakerSlash size={18} />
            )}
          </IconButton>

          {/* Mobile: open alert list */}
          <IconButton
            label="Alert list"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <List size={18} />
          </IconButton>
        </div>
      </div>

      {/* Search: second row on mobile */}
      <div className="px-3 pb-2.5 md:hidden">
        <SearchBox onPick={onPick} />
      </div>
    </header>
  );
}

function IconButton({
  children,
  label,
  onClick,
  active = false,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
        active
          ? "border-storm-500/40 bg-storm-500/15 text-storm-400"
          : "border-white/10 text-slate-300 hover:border-white/20 hover:text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}
