"use client";

import { Inbox } from "lucide-react";

import { useSwarmStore } from "@/lib/store";
import type { CBBAEvent } from "@/lib/types";

const EMPTY_BIDS: CBBAEvent[] = [];

export function CBBAPanel() {
  const cbba = useSwarmStore((s) => s.frame?.cbba_events ?? EMPTY_BIDS);
  const recent = cbba.slice(-12).reverse();
  const scenario = useSwarmStore((s) => s.frame?.scenario);
  const visible = scenario === "coverage";

  if (!visible) return null;

  return (
    <aside className="pointer-events-auto absolute bottom-44 right-0 z-10 flex h-44 w-[28rem] flex-col border-l border-t border-[var(--color-line)] bg-[var(--color-canvas)]/92 backdrop-blur-sm">
      <header className="flex items-baseline justify-between border-b border-[var(--color-line)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        <span>ED-CBBA · task allocation</span>
        <span className="text-[var(--color-text-dim)]">{cbba.length} bids</span>
      </header>
      <div className="scrollbar-hidden flex-1 overflow-y-auto font-mono text-[10.5px]">
        {recent.length === 0 && (
          <div className="flex items-center gap-2 px-3 py-3 text-[var(--color-text-vdim)]">
            <Inbox className="h-3 w-3" />
            <span>No bids yet.</span>
          </div>
        )}
        {recent.map((b, i) => (
          <div
            key={`${b.t}-${i}`}
            className="flex items-baseline gap-2 border-b border-[var(--color-line)]/40 px-3 py-0.5"
          >
            <span className="w-12 shrink-0 tabular-nums text-[var(--color-text-vdim)]">
              {b.t.toFixed(2)}
            </span>
            <span className="w-20 shrink-0 text-[var(--color-status-caution)]">
              {b.task_id}
            </span>
            <span className="text-[var(--color-text-vdim)]">←</span>
            <span className="w-14 shrink-0 tabular-nums text-[var(--color-friend)]">
              DRN-{String(b.bidder_id).padStart(3, "0")}
            </span>
            <span className="ml-auto tabular-nums text-[var(--color-text-dim)]">
              {b.bid_score.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
