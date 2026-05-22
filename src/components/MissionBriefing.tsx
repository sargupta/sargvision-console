"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { MISSIONS } from "@/lib/missions";
import { useSwarmStore } from "@/lib/store";

const HOLD_MS = 4200;

export function MissionBriefing() {
  const scenario = useSwarmStore((s) => s.frame?.scenario);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const lastShownRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!scenario || scenario === lastShownRef.current) return;
    lastShownRef.current = scenario;
    setCurrent(scenario);
    setVisible(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), HOLD_MS);
  }, [scenario]);

  const mission = MISSIONS.find((m) => m.id === current);
  if (!mission) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="absolute inset-0 bg-[var(--color-canvas)]/60 backdrop-blur-sm" />
      <div
        className={cn(
          "relative w-[640px] overflow-hidden border bg-[var(--color-surface)]/95 transition-transform duration-300",
          visible ? "translate-y-0" : "-translate-y-3",
          mission.service === "IAF"
            ? "border-[var(--color-friend)]/50"
            : mission.service === "ARMY"
              ? "border-[var(--color-status-warn)]/50"
              : "border-[var(--color-neutral)]/50",
        )}
        style={{ borderRadius: 2 }}
      >
        {/* saffron accent strip */}
        <div className="h-1 w-full bg-[var(--color-saffron)]" />

        <div className="px-6 py-5">
          <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-vdim)]">
            <span>// MISSION BRIEF</span>
            <span>{mission.idex_ref}</span>
          </div>
          <div className="mt-2 font-mono text-[22px] tracking-[0.06em] text-[var(--color-text)]">
            {mission.title}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-friend)]">
            {mission.service} · ₹{mission.ticket_inr_cr} cr ticket · CLASSIFIED // OFFICIAL USE
          </div>

          <p className="mt-4 max-w-prose text-[13px] leading-relaxed text-[var(--color-text-dim)]">
            {mission.brief}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
            <div className="flex items-baseline justify-between border-b border-[var(--color-line)]/60 pb-1">
              <dt className="text-[var(--color-text-vdim)]">Theatre</dt>
              <dd className="text-[var(--color-text)]">LEH · LADAKH</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-[var(--color-line)]/60 pb-1">
              <dt className="text-[var(--color-text-vdim)]">Force</dt>
              <dd className="text-[var(--color-text)]">24 × ALFA-S</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-[var(--color-line)]/60 pb-1">
              <dt className="text-[var(--color-text-vdim)]">Comms</dt>
              <dd className="text-[var(--color-text)]">A2A · Zenoh · MAVLink</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-[var(--color-line)]/60 pb-1">
              <dt className="text-[var(--color-text-vdim)]">Autonomy</dt>
              <dd className="text-[var(--color-text)]">Brooks subsumption + LLM intent</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-[var(--color-line)]/60 pb-1">
              <dt className="text-[var(--color-text-vdim)]">ROE auth</dt>
              <dd className="text-[var(--color-text)]">SwarmRaft K=7 BFT</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-[var(--color-line)]/60 pb-1">
              <dt className="text-[var(--color-text-vdim)]">Task alloc</dt>
              <dd className="text-[var(--color-text)]">ED-CBBA (centrality-aware)</dd>
            </div>
          </dl>

          <div className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-status-ok)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-status-ok)] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-status-ok)]" />
            </span>
            INITIATING ENGINE LINK …
          </div>
        </div>
      </div>
    </div>
  );
}
