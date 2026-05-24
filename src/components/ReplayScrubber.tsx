"use client";

import { Pause, Play, Rewind } from "lucide-react";

import { cn } from "@/lib/cn";
import { useReplay } from "@/lib/replay";

export function ReplayScrubber() {
  const buffer = useReplay((s) => s.buffer);
  const cursor = useReplay((s) => s.cursor);
  const scrubTo = useReplay((s) => s.scrubTo);

  if (buffer.length < 20) return null;

  const live = cursor === null;
  const idx = cursor ?? buffer.length - 1;
  const frame = buffer[idx];
  const tFirst = buffer[0].t;
  const tLast = buffer[buffer.length - 1].t;
  const tAt = frame.t;

  return (
    <div className="pointer-events-auto absolute bottom-1 left-1/2 z-30 flex w-[calc(100vw-1.5rem)] max-w-[640px] -translate-x-1/2 items-center gap-2 rounded-[2px] border border-[var(--color-line)] bg-[var(--color-canvas)]/95 px-3 py-1 font-mono text-[10px] backdrop-blur-sm">
      <button
        type="button"
        onClick={() => scrubTo(live ? buffer.length - 2 : null)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[1px] border px-1.5 py-0.5 uppercase tracking-[0.18em] transition-colors",
          live
            ? "border-[var(--color-status-ok)]/40 bg-[var(--color-status-ok)]/8 text-[var(--color-status-ok)]"
            : "border-[var(--color-status-warn)]/60 bg-[var(--color-status-warn)]/15 text-[var(--color-status-warn)]",
        )}
        title={live ? "Click to pause + scrub" : "Click to return to live"}
      >
        {live ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        {live ? "LIVE" : "REPLAY"}
      </button>

      <input
        type="range"
        min={0}
        max={buffer.length - 1}
        value={idx}
        onChange={(e) => scrubTo(parseInt(e.target.value, 10))}
        className="flex-1 accent-[var(--color-friend)]"
      />

      <span className="inline-flex items-center gap-1 tabular-nums text-[var(--color-text-dim)]">
        <Rewind className="h-3 w-3 text-[var(--color-text-vdim)]" />
        <span>
          t = <span className="text-[var(--color-text)]">{tAt.toFixed(2)}s</span> ·
        </span>
        <span className="text-[var(--color-text-vdim)]">
          buffer {(tLast - tFirst).toFixed(1)}s · {buffer.length} frames
        </span>
      </span>
    </div>
  );
}
