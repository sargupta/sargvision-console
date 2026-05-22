"use client";

import { useIntentHistory } from "@/lib/history";

const INTENT_LABEL: Record<string, string> = {
  hold_formation: "HOLD",
  advance_to_goal: "ADV",
  yield_to_neighbor: "YLD",
  rotate_role: "ROT",
  report_health: "HB",
};

const INTENT_COLOR: Record<string, string> = {
  hold_formation: "var(--color-text-dim)",
  advance_to_goal: "var(--color-friend)",
  yield_to_neighbor: "var(--color-status-warn)",
  rotate_role: "var(--color-status-caution)",
  report_health: "var(--color-status-ok)",
};

export function IntentTimeline({ droneId }: { droneId: number }) {
  const ticks = useIntentHistory((s) => s.byDrone.get(droneId) ?? []);

  if (ticks.length === 0) {
    return (
      <div className="font-mono text-[10px] text-[var(--color-text-vdim)]">
        No history yet.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {ticks.map((tick, i) => {
        const isLast = i === ticks.length - 1;
        return (
          <div
            key={`${tick.t}-${i}`}
            className="flex flex-col items-center"
            title={`${tick.intent} @ ${tick.t.toFixed(2)}s`}
          >
            <span
              className="rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.15em]"
              style={{
                color: INTENT_COLOR[tick.intent] ?? "var(--color-text-dim)",
                borderColor: `${INTENT_COLOR[tick.intent] ?? "var(--color-text-dim)"}40`,
                background: isLast
                  ? `${INTENT_COLOR[tick.intent] ?? "var(--color-text-dim)"}15`
                  : "transparent",
              }}
            >
              {INTENT_LABEL[tick.intent] ?? tick.intent.slice(0, 4).toUpperCase()}
            </span>
            <span className="mt-0.5 font-mono text-[8.5px] tabular-nums text-[var(--color-text-vdim)]">
              {tick.t.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
