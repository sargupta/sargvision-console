"use client";

import { ChevronDown, Plane, Ship, Target } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { MISSIONS, type Mission, switchMission } from "@/lib/missions";
import { useSwarmStore } from "@/lib/store";

const SERVICE_ICON = {
  IAF: Plane,
  ARMY: Target,
  NAVY: Ship,
};

export function MissionPicker() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = useSwarmStore((s) => s.frame?.scenario);

  const current: Mission =
    MISSIONS.find((m) => m.id === active) ?? MISSIONS[0];
  const ServiceIcon = SERVICE_ICON[current.service];

  async function pick(m: Mission) {
    setBusy(true);
    setOpen(false);
    try {
      await switchMission(m.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "pointer-events-auto inline-flex items-center gap-2 rounded-[2px] border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
          open
            ? "border-[var(--color-friend)]/60 bg-[var(--color-friend)]/12 text-[var(--color-friend)]"
            : "border-[var(--color-line)] bg-[var(--color-canvas)]/85 text-[var(--color-text-dim)] hover:border-[var(--color-friend)]/40 hover:text-[var(--color-text)]",
        )}
      >
        <ServiceIcon className="h-3.5 w-3.5" />
        <span className="text-[var(--color-text)]">{current.short}</span>
        <span className="text-[var(--color-text-vdim)]">{current.idex_ref}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-180 text-[var(--color-friend)]",
          )}
        />
      </button>

      {open && (
        <div className="pointer-events-auto absolute left-0 top-[calc(100%+6px)] z-50 w-[480px] rounded-[2px] border border-[var(--color-line)] bg-[var(--color-canvas)]/97 p-2 shadow-2xl backdrop-blur-sm">
          <div className="mb-1 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            Mission queue
          </div>
          {MISSIONS.map((m) => {
            const Icon = SERVICE_ICON[m.service];
            const isActive = m.id === current.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => pick(m)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[2px] px-2 py-2 text-left transition-colors",
                  isActive
                    ? "bg-[var(--color-friend)]/12"
                    : "hover:bg-[var(--color-elevated)]/60",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-none",
                    isActive ? "text-[var(--color-friend)]" : "text-[var(--color-text-dim)]",
                  )}
                />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2 font-mono text-[12px]">
                    <span className="text-[var(--color-text)]">{m.title}</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
                      {m.service} · {m.idex_ref}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-[var(--color-text-dim)]">
                    {m.brief}
                  </div>
                  {m.ticket_inr_cr > 0 && (
                    <div className="mt-1 inline-block rounded-[2px] border border-[var(--color-status-warn)]/40 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-status-warn)]">
                      ₹{m.ticket_inr_cr} cr ticket
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
