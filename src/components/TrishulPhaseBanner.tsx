"use client";

/** Bottom-center scripted phase caption for Operation Trishul.
 *
 * Shows the current phase name + caption + a thin progress bar. Auto-hides
 * when the active scenario is not `border_strike` or when no trishul payload
 * is present on the frame.
 */

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";

const PHASE_COLOR: Record<string, string> = {
  friend: "var(--color-friend)",
  warn: "var(--color-status-warn)",
  hostile: "var(--color-hostile)",
  ok: "var(--color-status-ok)",
};

export function TrishulPhaseBanner() {
  const trishul = useSwarmStore((s) => s.frame?.trishul);
  const scenario = useSwarmStore((s) => s.frame?.scenario);

  if (!trishul || scenario !== "border_strike") return null;

  const ph = trishul.phase;
  const color = PHASE_COLOR[ph.color] ?? "var(--color-friend)";
  const elapsedTxt = `${ph.elapsed_s.toFixed(1)}/${ph.duration_s.toFixed(0)}s`;
  const protectedCount = trishul.hvts.filter((h) => h.status === "PROTECTED").length;
  const struckCount = trishul.hvts.filter((h) => h.status === "STRUCK").length;
  const underAttackCount = trishul.hvts.filter((h) => h.status === "UNDER_ATTACK").length;

  return (
    <div className="pointer-events-none absolute bottom-32 md:bottom-12 left-1/2 z-30 w-[calc(100vw-1rem)] max-w-[680px] -translate-x-1/2 font-mono">
      <div
        className="overflow-hidden rounded-[2px] border bg-[var(--color-canvas)]/95 backdrop-blur-sm"
        style={{ borderColor: `${color}66` }}
      >
        {/* phase header bar */}
        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-line)] px-3 py-1.5">
          <div className="flex items-baseline gap-2">
            <span
              className="text-[10.5px] uppercase tracking-[0.22em]"
              style={{ color }}
            >
              // OPERATION TRISHUL
            </span>
            <span className="text-[9.5px] uppercase tracking-[0.22em] text-[var(--color-text-vdim)]">
              PHASE {ph.idx + 1}/{ph.of} · {elapsedTxt}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] tabular-nums">
            <span className="text-[var(--color-status-ok)]">PROTECTED {protectedCount}</span>
            {underAttackCount > 0 && (
              <span className="text-[var(--color-status-warn)]">· U/ATTK {underAttackCount}</span>
            )}
            {struckCount > 0 && (
              <span className="text-[var(--color-hostile)]">· STRUCK {struckCount}</span>
            )}
          </div>
        </div>

        {/* phase name + caption */}
        <div className="flex items-baseline gap-3 px-3 py-2">
          <span
            className="font-semibold tracking-[0.18em] text-[13px]"
            style={{ color }}
          >
            {ph.name}
          </span>
          <span className="text-[12px] leading-snug text-[var(--color-text)]">
            {ph.caption}
          </span>
        </div>

        {/* progress bar */}
        <div className="h-[3px] w-full bg-[var(--color-line)]/40">
          <div
            className={cn("h-full transition-[width] duration-150")}
            style={{ width: `${ph.progress * 100}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}
