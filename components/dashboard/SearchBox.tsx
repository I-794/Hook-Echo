"use client";

// Location search. Debounced calls to /api/geocode (server-side Nominatim),
// keyboard-navigable result list. Picking a result hands lat/lon up to the
// dashboard, which sets the saved point and flies the map there.

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass, X, Spinner } from "@phosphor-icons/react";
import { geocode } from "@/lib/client";
import type { GeocodeResult } from "@/lib/types";

export function SearchBox({
  onPick,
}: {
  onPick: (lat: number, lon: number, label: string) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      geocode(term, ctrl.signal)
        .then((r) => {
          setResults(r);
          setOpen(true);
          setActive(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 320);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (r: GeocodeResult) => {
    onPick(r.lat, r.lon, r.label);
    setQ(shortLabel(r.label));
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-800/80 px-3.5 py-2 focus-within:border-storm-500/50">
        <MagnifyingGlass size={16} className="shrink-0 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search a city, town, or ZIP"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          aria-label="Search location"
        />
        {loading ? (
          <Spinner size={16} className="shrink-0 animate-spin text-slate-500" />
        ) : q ? (
          <button
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            aria-label="Clear search"
            className="shrink-0 text-slate-500 hover:text-slate-300"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-ink-900/95 py-1 shadow-2xl backdrop-blur">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
                className={`block w-full px-3.5 py-2 text-left text-sm transition-colors ${
                  i === active ? "bg-storm-500/10 text-white" : "text-slate-300"
                }`}
              >
                <span className="block truncate font-medium">
                  {shortLabel(r.label)}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {r.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function shortLabel(label: string): string {
  return label.split(",").slice(0, 2).join(",").trim();
}
