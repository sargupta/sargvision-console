"use client";

import {
  CheckCircle2,
  Crosshair,
  Eye,
  Gavel,
  Plane,
  ShieldOff,
  Skull,
  Sparkles,
} from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/cn";
import { type EngagementEvent, type Phase, useEngagementLog } from "@/lib/engagement";

const PHASE_META: Record<
  Phase,
  { label: string; color: string; Icon: ComponentType<{ className?: string }> }
> = {
  detect: { label: "DETECT", color: "var(--color-friend)", Icon: Eye },
  classify: { label: "CLASSIFY", color: "#A78BFA", Icon: Sparkles },
  decoy_skipped: {
    label: "SKIP-DECOY",
    color: "var(--color-status-caution)",
    Icon: ShieldOff,
  },
  auction: { label: "AUCTION", color: "var(--color-status-warn)", Icon: Gavel },
  authorize: { label: "AUTHORIZE", color: "var(--color-status-ok)", Icon: CheckCircle2 },
  vector: { label: "VECTOR", color: "var(--color-status-ok)", Icon: Plane },
  kia: { label: "KIA", color: "var(--color-hostile)", Icon: Skull },
};

export function EngagementTimeline() {
  const events = useEngagementLog((s) => s.events);
  const reset = useEngagementLog((s) => s.reset);

  const tail = events.slice(-100).reverse();

  return (
    <section className="pointer-events-auto absolute left-72 bottom-[20rem] z-10 flex h-44 w-[26rem] flex-col rounded-[2px] border border-[var(--color-line)] bg-[var(--color-canvas)]/92 backdrop-blur-sm">
      <header className="flex items-baseline justify-between border-b border-[var(--color-line)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="inline-flex items-center gap-1.5 text-[var(--color-text-dim)]">
          <Crosshair className="h-3 w-3" />
          Kill-chain timeline · live
        </span>
        <button
          type="button"
          onClick={reset}
          className="rounded-[1px] border border-[var(--color-line)] px-1.5 py-0.5 text-[9px] text-[var(--color-text-vdim)] hover:border-[var(--color-text-dim)] hover:text-[var(--color-text-dim)]"
        >
          clear
        </button>
      </header>
      <ul className="scrollbar-hidden flex-1 overflow-y-auto font-mono text-[10px]">
        {tail.length === 0 && (
          <li className="px-3 py-2 text-[var(--color-text-vdim)]">
            No engagements yet. Pick the IAF Counter-Swarm mission and wait for sensors to acquire.
          </li>
        )}
        {tail.map((ev, i) => (
          <Row key={`${ev.t}-${ev.phase}-${i}`} ev={ev} />
        ))}
      </ul>
    </section>
  );
}

function Row({ ev }: { ev: EngagementEvent }) {
  const meta = PHASE_META[ev.phase];
  return (
    <li
      className={cn(
        "flex items-start gap-2 border-b border-[var(--color-line)]/40 px-3 py-1 hover:bg-[var(--color-elevated)]/30",
      )}
    >
      <span className="w-10 shrink-0 pt-0.5 tabular-nums text-[var(--color-text-vdim)]">
        {ev.t.toFixed(1)}
      </span>
      <span
        className="inline-flex w-[88px] shrink-0 items-center gap-1 pt-0.5 uppercase tracking-[0.16em]"
        style={{ color: meta.color }}
      >
        <meta.Icon className="h-3 w-3" />
        {meta.label}
      </span>
      <span className="flex-1 text-[var(--color-text-dim)]">{ev.detail}</span>
    </li>
  );
}
