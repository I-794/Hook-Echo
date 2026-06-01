"use client";

// Browser-notification + audio-alarm manager. Permission is requested only when
// the user turns notifications on (a user gesture), per the Notifications spec.
// The alarm is synthesized with WebAudio so there's no audio asset to ship.

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewWarning } from "./useWeather";

const NOTIFY_KEY = "hookecho.notify";
const AUDIO_KEY = "hookecho.audio";

type Perm = NotificationPermission | "unsupported";

function readBool(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
}

export function useNotifier() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<Perm>("default");
  const [enabled, setEnabled] = useState(false);
  const [audio, setAudio] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "Notification" in window;
    setSupported(ok);
    setPermission(ok ? Notification.permission : "unsupported");
    setEnabled(readBool(NOTIFY_KEY));
    setAudio(readBool(AUDIO_KEY));
  }, []);

  const persist = (key: string, v: boolean) => {
    try {
      window.localStorage.setItem(key, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const toggleEnabled = useCallback(async () => {
    if (!supported) return;
    if (!enabled) {
      // Turning on: request permission within this click gesture.
      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        setEnabled(true);
        persist(NOTIFY_KEY, true);
      }
    } else {
      setEnabled(false);
      persist(NOTIFY_KEY, false);
    }
  }, [enabled, supported]);

  const toggleAudio = useCallback(() => {
    setAudio((prev) => {
      const next = !prev;
      persist(AUDIO_KEY, next);
      // Unlock/resume the AudioContext on this user gesture.
      if (next) {
        try {
          audioCtx.current ??= new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
          void audioCtx.current.resume();
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }, []);

  const playAlarm = useCallback(() => {
    if (!audio) return;
    try {
      audioCtx.current ??= new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const ctx = audioCtx.current;
      void ctx.resume();
      // Two-tone alert (high-low-high), short and unmistakable.
      const seq = [880, 660, 880];
      const now = ctx.currentTime;
      seq.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const t = now + i * 0.22;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.21);
      });
    } catch {
      /* ignore */
    }
  }, [audio]);

  /** Fire OS notifications + alarm for a batch of new warnings. */
  const notify = useCallback(
    (warnings: NewWarning[]) => {
      if (!warnings.length) return;
      if (enabled && supported && Notification.permission === "granted") {
        for (const w of warnings.slice(0, 3)) {
          try {
            const n = new Notification(w.event, {
              body: w.headline,
              tag: w.id, // collapse duplicates
              icon: "/icon.svg",
            });
            n.onclick = () => {
              window.focus();
              n.close();
            };
          } catch {
            /* ignore */
          }
        }
      }
      playAlarm();
    },
    [enabled, supported, playAlarm],
  );

  return {
    supported,
    permission,
    enabled,
    audio,
    toggleEnabled,
    toggleAudio,
    notify,
  };
}
