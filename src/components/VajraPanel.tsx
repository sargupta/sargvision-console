"use client";

import { AlertTriangle, Network, Repeat, Zap } from "lucide-react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";

export function VajraPanel() {
  const vajra = useSwarmStore((s) => s.frame?.vajra);
  if (!vajra) return null;

  const fragmented = vajra.fragmented;
  const lambdaPct = Math.min(1, vajra.lambda2 / 0.6);  // 0.6 ≈ healthy ceiling
  const owners = Object.keys(vajra.voronoi_owners).length;

  return (
    <aside className="pointer-events-auto absolute right-3 top-32 z-20 flex w-[18rem] flex-col rounded-[2px] border border-[var(--color-line)] bg-[var(--color-canvas)]/95 backdrop-blur-sm">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="inline-flex items-center gap-1.5 text-[var(--color-saffron)]">
          <Zap className="h-3 w-3" />
          VAJRA · strike doctrine
        </span>
        <span
          className={cn(
            "rounded-[1px] border px-1 py-px text-[9px] tabular-nums",
            fragmented
              ? "border-[var(--color-hostile)]/60 bg-[var(--color-hostile)]/15 text-[var(--color-hostile)]"
              : "border-[var(--color-status-ok)]/40 bg-[var(--color-status-ok)]/8 text-[var(--color-status-ok)]",
          )}
        >
          {fragmented ? "FRAGMENTED" : "CONNECTED"}
        </span>
      </header>
      <div className="px-2.5 py-2 font-mono text-[10.5px]">
        {/* Algebraic connectivity (Fiedler λ₂) */}
        <div className="mb-2">
          <div className="flex items-baseline justify-between text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            <span className="inline-flex items-center gap-1">
              <Network className="h-3 w-3" /> λ₂(L) · Fiedler
            </span>
            <span className="tabular-nums text-[var(--color-text)]">
              {vajra.lambda2.toFixed(3)}
            </span>
          </div>
          <div className="mt-0.5 h-1.5 w-full rounded-[1px] bg-[var(--color-line)]">
            <div
              className="h-1.5 rounded-[1px] transition-[width] duration-200"
              style={{
                width: `${Math.round(lambdaPct * 100)}%`,
                background: fragmented
                  ? "var(--color-hostile)"
                  : vajra.lambda2 < 0.05
                    ? "var(--color-status-warn)"
                    : "var(--color-status-ok)",
              }}
            />
          </div>
          <div className="mt-0.5 text-[9px] text-[var(--color-text-vdim)]">
            higher = more resilient · alarm if {"<"} {vajra.fragmentation_threshold.toFixed(3)}
          </div>
        </div>

        {/* Components */}
        <div className="grid grid-cols-3 gap-1.5">
          <Stat
            label="Components"
            value={vajra.n_components.toString()}
            warn={vajra.n_components > 1}
          />
          <Stat
            label="Voronoi"
            value={`${owners}/${vajra.n_hostiles_alive}`}
            tint="var(--color-saffron)"
          />
          <Stat
            label="Handovers"
            value={vajra.handover_count.toString()}
            tint="var(--color-text-dim)"
            Icon={Repeat}
          />
        </div>

        {/* Jamming factor */}
        {vajra.jamming_factor > 0 && (
          <div className="mt-2 flex items-center gap-1.5 rounded-[1px] border border-[var(--color-status-warn)]/40 bg-[var(--color-status-warn)]/8 px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-status-warn)]">
            <AlertTriangle className="h-3 w-3" />
            EW jamming · factor {vajra.jamming_factor.toFixed(2)}
          </div>
        )}

        {fragmented && (
          <div className="mt-1.5 rounded-[1px] border border-[var(--color-hostile)]/50 bg-[var(--color-hostile)]/12 px-1.5 py-1 text-[9.5px] text-[var(--color-hostile)]">
            ⚠ vajra splits into {vajra.n_components} components · re-pathing handovers
          </div>
        )}
      </div>
    </aside>
  );
}

function Stat({
  label,
  value,
  warn,
  tint,
  Icon,
}: {
  label: string;
  value: string;
  warn?: boolean;
  tint?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  const color = warn ? "var(--color-hostile)" : tint ?? "var(--color-status-ok)";
  return (
    <div className="rounded-[1px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 px-1.5 py-0.5">
      <div className="inline-flex items-center gap-1 text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {label}
      </div>
      <div className="tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
