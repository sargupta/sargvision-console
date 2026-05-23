"use client";

import { AlertTriangle, ArrowRightLeft, Mountain, Repeat } from "lucide-react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";

export function MigrationStats() {
  const mig = useSwarmStore((s) => s.frame?.migration);
  const scenario = useSwarmStore((s) => s.frame?.scenario);
  if (!mig || scenario !== "migration") return null;

  const tp = mig.throughput_per_min ?? {};
  const corridors = mig.zones.filter((z) => z.kind === "corridor");
  const violationsHot = mig.violations > 0;

  return (
    <aside className="pointer-events-auto absolute right-3 bottom-44 z-10 flex w-[22rem] flex-col rounded-[2px] border border-[var(--color-line)] bg-[var(--color-canvas)]/95 backdrop-blur-sm">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="inline-flex items-center gap-1.5 text-[var(--color-saffron)]">
          <Mountain className="h-3 w-3" />
          GOVERNED MIGRATION · live
        </span>
        <span className="tabular-nums text-[var(--color-text-dim)]">
          loops {mig.completed_loops}
        </span>
      </header>
      <div className="px-3 py-2 font-mono text-[10.5px]">
        {/* Throughput per corridor */}
        <div className="mb-2 grid grid-cols-3 gap-1.5">
          {corridors.map((z) => {
            const cnt = tp[z.id] ?? 0;
            const load = z.capacity > 0 ? z.occupancy / z.capacity : 0;
            const hot = load >= 0.8;
            return (
              <div
                key={z.id}
                className="rounded-[1px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 px-1.5 py-1"
              >
                <div className="text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
                  {z.name.split(" · ")[0]}
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span
                    className={cn(
                      "tabular-nums",
                      hot
                        ? "text-[var(--color-status-warn)]"
                        : "text-[var(--color-friend)]",
                    )}
                  >
                    {z.occupancy}/{z.capacity}
                  </span>
                  <span className="text-[9px] tabular-nums text-[var(--color-text-dim)]">
                    {cnt}/min
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Violations + loops + global throughput */}
        <div className="grid grid-cols-3 gap-1.5">
          <Stat
            Icon={AlertTriangle}
            label="Violations"
            value={mig.violations.toString()}
            color={violationsHot ? "var(--color-hostile)" : "var(--color-status-ok)"}
          />
          <Stat
            Icon={Repeat}
            label="Loops"
            value={mig.completed_loops.toString()}
            color="var(--color-friend)"
          />
          <Stat
            Icon={ArrowRightLeft}
            label="Σ thru/min"
            value={Object.values(tp).reduce((a, b) => a + b, 0).toString()}
            color="var(--color-status-ok)"
          />
        </div>
      </div>
    </aside>
  );
}

function Stat({
  Icon,
  label,
  value,
  color,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-[1px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 px-1.5 py-0.5">
      <div className="inline-flex items-center gap-1 text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className="tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
