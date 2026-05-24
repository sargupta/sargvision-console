"use client";

/** CHANAKYA — Curvature-Hamilton Action-minimising Network for Kinematic Yield.
 *
 *  Riemannian SEAD-ingress geodesic planner. Equips R² with metric
 *      g_ij(x) = δ_ij · (1 + βΦ(x))^γ
 *  where Φ is the kernel-density threat field of hostile IADS assets. Plans
 *  drone trajectories as grid-Dijkstra geodesics that curve around high-Φ
 *  zones. Action-cost savings vs straight-line baseline are surfaced as a
 *  scalar telemetry; reactive replan on defense-field changes.
 */

import { Compass, Crosshair, TrendingDown } from "lucide-react";

import { useSwarmStore } from "@/lib/store";

export function ChanakyaPanel() {
  const chanakya = useSwarmStore((s) => s.frame?.chanakya);

  if (!chanakya || !chanakya.enabled) {
    return (
      <div className="rounded-md border border-[--color-border-soft] bg-[--color-panel] p-3 text-xs text-[--color-text-vdim]">
        CHANAKYA: idle (no SEAD ingress active)
      </div>
    );
  }

  const savingsPct = Math.round(chanakya.mean_savings_ratio * 100);
  const nActive = chanakya.defense_assets.filter((a) => a.active).length;

  return (
    <div className="rounded-md border border-[--color-border-soft] bg-[--color-panel] p-3 text-[11px]">
      <header className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[--color-text-dim]">
        <Compass className="h-3 w-3" /> CHANAKYA — SEAD Ingress
        <span className="ml-auto text-[--color-text-vdim]">
          replans={chanakya.n_replans}
        </span>
      </header>

      {/* Plan summary */}
      <div className="mb-2 grid grid-cols-3 gap-1 text-[9px]">
        <div className="text-center">
          <div className="text-[--color-text-vdim]">planned</div>
          <div className="font-mono text-[--color-text]">{chanakya.n_drones_planned}</div>
        </div>
        <div className="text-center">
          <div className="text-[--color-text-vdim]">arrivals</div>
          <div className="font-mono text-[--color-friend]">{chanakya.arrivals}</div>
        </div>
        <div className="text-center">
          <div className="text-[--color-text-vdim]">losses</div>
          <div className="font-mono text-[--color-hostile]">{chanakya.kills}</div>
        </div>
      </div>

      {/* Action-cost savings (riemannian geodesic vs straight-line) */}
      <div className="mb-2 rounded-sm border border-[--color-border-soft] bg-[--color-bg]/30 p-1.5">
        <div className="flex items-center gap-1 text-[9px] text-[--color-text-vdim]">
          <TrendingDown className="h-2.5 w-2.5" /> action savings vs straight-line
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-sm bg-[--color-bg]">
            <div
              className="h-full rounded-sm bg-[--color-friend]"
              style={{ width: `${Math.min(100, Math.max(0, savingsPct))}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-[--color-text]">{savingsPct}%</span>
        </div>
        <div className="mt-1 text-[8px] text-[--color-text-vdim]">
          Σ ∫√g ds = {chanakya.total_action_cost.toFixed(1)} (vs straight {chanakya.total_straight_cost.toFixed(1)})
        </div>
      </div>

      {/* Defense-asset summary */}
      <div className="flex items-center justify-between border-t border-[--color-border-soft] pt-2 text-[9px]">
        <span className="flex items-center gap-1 text-[--color-text-vdim]">
          <Crosshair className="h-2.5 w-2.5 text-[--color-hostile]" /> hostile IADS
        </span>
        <span className="font-mono">
          <span className="text-[--color-hostile]">{nActive}</span>
          <span className="text-[--color-text-vdim]">
            {" / "}
            {chanakya.defense_assets.length}
          </span>
          {" active"}
        </span>
      </div>
    </div>
  );
}
