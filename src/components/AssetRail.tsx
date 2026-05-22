"use client";

import { Battery, BatteryLow, Crown, Radio, Satellite, Wrench } from "lucide-react";
import { useMemo } from "react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import type { DroneState, Role } from "@/lib/types";

const EMPTY_DRONES: DroneState[] = [];

const ROLE_LABEL: Record<Role, string> = {
  worker: "WK",
  scout: "SC",
  relay: "RL",
  leader: "LD",
};

const ROLE_COLOR: Record<Role, string> = {
  worker: "text-[var(--color-friend)] border-[var(--color-friend)]/40",
  scout: "text-[var(--color-status-ok)] border-[var(--color-status-ok)]/40",
  relay: "text-[var(--color-status-caution)] border-[var(--color-status-caution)]/40",
  leader: "text-[var(--color-status-warn)] border-[var(--color-status-warn)]/40",
};

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  worker: Wrench,
  scout: Satellite,
  relay: Radio,
  leader: Crown,
};


export function AssetRail() {
  const drones = useSwarmStore((s) => s.frame?.drones ?? EMPTY_DRONES);
  const selectedId = useSwarmStore((s) => s.selectedDroneId);
  const select = useSwarmStore((s) => s.select);

  const sorted = useMemo(() => [...drones].sort((a, b) => a.id - b.id), [drones]);

  const counts = useMemo(() => {
    const c: Record<Role, number> = { worker: 0, scout: 0, relay: 0, leader: 0 };
    for (const d of drones) c[d.role] += 1;
    return c;
  }, [drones]);

  return (
    <aside className="pointer-events-auto absolute left-0 top-12 z-10 flex h-[calc(100vh-3.5rem)] w-72 flex-col border-r border-[var(--color-line)] bg-[var(--color-canvas)]/92 backdrop-blur-sm">
      <header className="border-b border-[var(--color-line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        <div className="flex items-center justify-between">
          <span>Assets · {drones.length.toString().padStart(2, "0")}</span>
          <span className="text-[var(--color-text-dim)]">
            WK {counts.worker} · SC {counts.scout} · RL {counts.relay} · LD {counts.leader}
          </span>
        </div>
      </header>
      <div className="scrollbar-hidden flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="px-3 py-6 font-mono text-[11px] text-[var(--color-text-vdim)]">
            Awaiting link…
          </div>
        )}
        {sorted.map((d) => (
          <AssetRow
            key={d.id}
            drone={d}
            active={selectedId === d.id}
            onClick={() => select(selectedId === d.id ? null : d.id)}
          />
        ))}
      </div>
    </aside>
  );
}

function AssetRow({
  drone,
  active,
  onClick,
}: {
  drone: DroneState;
  active: boolean;
  onClick: () => void;
}) {
  const RoleIcon = ROLE_ICON[drone.role];
  const battLow = drone.battery < 0.25;
  const batt = Math.round(drone.battery * 100);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 border-b border-[var(--color-line)]/60 px-3 py-2 text-left transition-colors",
        active
          ? "bg-[var(--color-friend)]/10"
          : "hover:bg-[var(--color-elevated)]/40",
      )}
    >
      <RoleIcon className={cn("h-3.5 w-3.5", ROLE_COLOR[drone.role].split(" ")[0])} />
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-baseline justify-between gap-2 font-mono text-[11px]">
          <span className="text-[var(--color-text)]">
            DRN-{String(drone.id).padStart(3, "0")}
          </span>
          <span
            className={cn(
              "rounded-[2px] border px-1 py-px text-[9px] uppercase tracking-[0.18em]",
              ROLE_COLOR[drone.role],
            )}
          >
            {ROLE_LABEL[drone.role]}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-[var(--color-text-vdim)]">
          <span
            className={cn(
              "truncate uppercase tracking-[0.15em]",
              drone.task?.startsWith("INTERCEPT") &&
                "text-[var(--color-status-caution)]",
            )}
          >
            {drone.task ?? drone.intent.replace(/_/g, " ")}
          </span>
          <span className="flex items-center gap-1">
            {battLow ? (
              <BatteryLow className="h-3 w-3 text-[var(--color-status-warn)]" />
            ) : (
              <Battery className="h-3 w-3 text-[var(--color-text-dim)]" />
            )}
            <span
              className={cn(
                "tabular-nums",
                battLow ? "text-[var(--color-status-warn)]" : "text-[var(--color-text-dim)]",
              )}
            >
              {batt}%
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
