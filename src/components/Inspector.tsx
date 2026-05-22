"use client";

import { Battery, Crosshair, Gauge, Navigation2, Plane, Signal, X } from "lucide-react";
import { useMemo } from "react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import type { DroneState, WireMessageEvent } from "@/lib/types";

type RecentMsg = Pick<WireMessageEvent, "protocol" | "topic" | "summary" | "t">;
const EMPTY_RECENT: RecentMsg[] = [];

export function Inspector() {
  const drone = useSwarmStore((s) =>
    s.selectedDroneId == null
      ? null
      : s.frame?.drones.find((d) => d.id === s.selectedDroneId) ?? null,
  );
  const select = useSwarmStore((s) => s.select);
  const neighbors = useSwarmStore((s) => {
    if (s.selectedDroneId == null || !s.frame) return 0;
    return s.frame.edges.filter(
      (e) => e.src === s.selectedDroneId || e.dst === s.selectedDroneId,
    ).length;
  });
  const selectedId = useSwarmStore((s) => s.selectedDroneId);
  const frame = useSwarmStore((s) => s.frame);
  const recent = useMemo<RecentMsg[]>(() => {
    if (selectedId == null || !frame) return EMPTY_RECENT;
    return frame.recent_messages
      .filter((m) => m.src === selectedId || m.dst === selectedId)
      .slice(-8)
      .reverse();
  }, [selectedId, frame]);

  if (!drone) return null;

  const battPct = Math.round(drone.battery * 100);
  const battColor =
    battPct < 25
      ? "var(--color-status-warn)"
      : battPct < 50
        ? "var(--color-status-caution)"
        : "var(--color-status-ok)";

  return (
    <aside className="pointer-events-auto absolute right-0 top-12 z-10 flex h-[calc(100vh-3.5rem)] w-[28rem] flex-col border-l border-[var(--color-line)] bg-[var(--color-canvas)]/92 backdrop-blur-sm">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        <span>Inspector · DRN-{String(drone.id).padStart(3, "0")}</span>
        <button
          type="button"
          onClick={() => select(null)}
          className="rounded-[2px] p-1 text-[var(--color-text-dim)] hover:bg-[var(--color-elevated)]/40 hover:text-[var(--color-text)]"
        >
          <X className="h-3 w-3" />
        </button>
      </header>

      <div className="scrollbar-hidden flex-1 overflow-y-auto px-3 py-3">
        <section className="mb-4 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-[2px] border border-[var(--color-friend)]/50 bg-[var(--color-friend)]/10">
            <Plane className="h-7 w-7 text-[var(--color-friend)]" />
          </div>
          <div className="flex flex-col">
            <div className="font-mono text-[15px] tracking-[0.12em] text-[var(--color-text)]">
              {drone.platform}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
              {drone.affiliation} · {drone.role} · {drone.healthy ? "NOMINAL" : "DEGRADED"}
            </div>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-2 gap-2 font-mono text-[11px]">
          <Stat
            Icon={Gauge}
            label="Battery"
            value={`${battPct}%`}
            tint={battColor}
            bar={drone.battery}
          />
          <Stat
            Icon={Signal}
            label="Neighbors"
            value={String(neighbors)}
          />
          <Stat
            Icon={Navigation2}
            label="Heading"
            value={`${drone.heading_deg.toFixed(0)}°`}
          />
          <Stat
            Icon={Crosshair}
            label="Velocity"
            value={`${drone.vel_ms.toFixed(2)} m/s`}
          />
        </section>

        <section className="mb-4 rounded-[2px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 px-2 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
          <Row label="LAT" value={drone.lat.toFixed(6)} />
          <Row label="LON" value={drone.lon.toFixed(6)} />
          <Row label="ALT" value={`${drone.alt_m.toFixed(2)} m AGL`} />
        </section>

        <section className="mb-4">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            Current intent (LLM emitted)
          </div>
          <div className="rounded-[2px] border border-[var(--color-friend)]/40 bg-[var(--color-friend)]/8 px-2 py-1.5 font-mono text-[12px] tracking-[0.06em] text-[var(--color-friend)]">
            {drone.intent.replace(/_/g, " ").toUpperCase()}
          </div>
        </section>

        <section>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            Recent comms (this drone)
          </div>
          <ul className="space-y-0.5">
            {recent.length === 0 && (
              <li className="font-mono text-[10px] text-[var(--color-text-vdim)]">
                No messages yet.
              </li>
            )}
            {recent.map((m, i) => (
              <li
                key={i}
                className="flex items-baseline gap-2 font-mono text-[10px]"
              >
                <span className="tabular-nums text-[var(--color-text-vdim)]">
                  {m.t.toFixed(2)}
                </span>
                <span className={cn(protocolColor(m.protocol), "uppercase tracking-[0.18em]")}>
                  {m.protocol}
                </span>
                <span className="truncate text-[var(--color-text-dim)]">{m.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}

function Stat({
  Icon,
  label,
  value,
  tint,
  bar,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tint?: string;
  bar?: number;
}) {
  return (
    <div className="rounded-[2px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 px-2 py-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
          <Icon className="h-3 w-3" /> {label}
        </span>
        <span className="text-[12px] tabular-nums" style={{ color: tint ?? "var(--color-text)" }}>
          {value}
        </span>
      </div>
      {bar != null && (
        <div className="mt-1 h-1 w-full rounded-[1px] bg-[var(--color-line)]">
          <div
            className="h-1 rounded-[1px] transition-[width] duration-200"
            style={{ width: `${Math.round(bar * 100)}%`, background: tint ?? "var(--color-friend)" }}
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span>{label}</span>
      <span className="tabular-nums normal-case text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function protocolColor(p: string): string {
  switch (p) {
    case "A2A":
      return "text-[#A78BFA]";
    case "Zenoh":
      return "text-[var(--color-friend)]";
    case "MAVLink":
      return "text-[var(--color-status-ok)]";
    case "BFT":
      return "text-[var(--color-status-crit)]";
    case "gRPC":
      return "text-[var(--color-status-warn)]";
    default:
      return "text-[var(--color-text-dim)]";
  }
}
