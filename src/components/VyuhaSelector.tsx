"use client";

/** VyuhaSelector — operator-side strategy switcher for Operation Trishul.
 *
 *  Renders 4 buttons (CENTRAL · DISTRIBUTED · LAYERED · CAP) only when the
 *  active scenario is `border_strike`. POSTs to /vyuha/{strategy} to hot-swap
 *  the defence posture mid-engagement and instantly reseats friendly drones.
 *
 *  Embeds in the TopBar between mission name and stats. Hidden when not
 *  border-strike so the bar stays uncluttered for other scenarios.
 */

import {
  Crosshair, Layers, Network, Repeat, Target, Compass,
  Eye, EyeOff, Skull, Rocket, Wind, Shield, Mountain, Activity,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";

const HTTP_URL = process.env.NEXT_PUBLIC_SWARM_HTTP_URL ?? "http://127.0.0.1:8765";

// Strategy metadata — keyed by the Python-side strategy id.
// Whatever ids the backend lists in `frame.vyuha.available` are the buttons
// we render (drives both Trishul + Coverage today; future scenarios just add
// rows here).
const STRATEGY_META: Record<string, { label: string; Icon: LucideIcon; hint: string }> = {
  // Trishul (multi-HVT defence)
  central:     { label: "CENTRAL",     Icon: Target,  hint: "All drones at one rally point. Naive baseline — outer HVTs lose to reaction-time deficit." },
  distributed: { label: "DISTRIBUTED", Icon: Network, hint: "Drones pre-positioned per HVT proportional to value × P(attack). 7× reaction-time improvement vs central." },
  layered:     { label: "LAYERED",     Icon: Layers,  hint: "3-ring defence — outer recon + middle intercept + inner point defence. Multiple intercept opportunities per inbound." },
  cap:         { label: "CAP",         Icon: Repeat,  hint: "Combat Air Patrol racetrack orbits between HVTs. Mobile, fuel-intensive, best vs unpredicted axes." },
  // Coverage (single protected zone)
  ring_uniform:      { label: "RING",     Icon: Target,  hint: "Even ring at radius 7m around the zone. Best when threat is unknown / 360°." },
  azimuth_weighted:  { label: "AZIMUTH",  Icon: Compass, hint: "Heavier defence on detected threat bearing (von-Mises). Best when intel reveals attack axis." },
  layered_intercept: { label: "LAYERED",  Icon: Layers,  hint: "3-ring layered defence — outer recon (r=12m) + middle intercept (r=8m) + inner point defence (r=3m)." },
  flying_cap:        { label: "FLYING-CAP", Icon: Repeat, hint: "Drones on continuous racetrack orbit at r=8m. Lowest intercept lag, high fuel burn." },
  // SEAD ingress (offensive penetration of hostile IADS)
  geodesic_direct:   { label: "GEODESIC",   Icon: Rocket,   hint: "All drones plan the same Riemannian geodesic — shortest action over the threat manifold. Naive baseline." },
  decoy_mass:        { label: "DECOY-MASS", Icon: Skull,    hint: "40% decoy wave first (direct through IADS centre), 60% strike package follows after radars commit to decoys." },
  wild_weasel:       { label: "WEASEL",     Icon: Eye,      hint: "20% SEAD-specialised drones hit radars first; once IADS is suppressed, strike package transits the safe corridor." },
  low_observable:    { label: "LOW-OBS",    Icon: EyeOff,   hint: "Bumps Riemannian β/γ — geodesics hug the threat-field zero contour. Longest path, near-zero detection." },
  // Migration (multi-corridor traversal)
  load_balanced:     { label: "BALANCED",  Icon: Activity, hint: "Default — distance + capacity + hazard weighted equally. Steady operations." },
  fastest_corridor:  { label: "FASTEST",   Icon: Wind,     hint: "All drones go through the highest-capacity pass. Concentration risk if it closes." },
  safest_corridor:   { label: "SAFEST",    Icon: Shield,   hint: "All drones go through the lowest-hazard pass. Slowest but most resilient." },
  adaptive_reroute:  { label: "ADAPTIVE",  Icon: Mountain, hint: "Like BALANCED but with 3× hazard weight — drones aggressively avoid emerging storms." },
};

export function VyuhaSelector() {
  const scenario = useSwarmStore((s) => s.frame?.scenario);
  const vyuha = useSwarmStore((s) => s.frame?.vyuha);
  const active = vyuha?.strategy as string | undefined;
  const available: string[] = (vyuha?.available as string[] | undefined) ?? [];
  const [busy, setBusy] = useState(false);

  // Show selector only when the scenario actually exposes strategies.
  if (!scenario || available.length === 0) return null;

  async function set(s: string) {
    setBusy(true);
    try {
      await fetch(`${HTTP_URL}/vyuha/${s}`, { method: "POST" });
    } finally {
      setBusy(false);
    }
  }

  // Per-scenario header label — matches the doctrinal vocabulary the strategy
  // family belongs to. Trishul uses VYUHA (Sanskrit battle formation), Coverage
  // uses POSTURE, SEAD uses TACTIC, Migration uses ROUTE.
  const headerLabel =
    scenario === "border_strike" ? "VYUHA" :
    scenario === "coverage"      ? "POSTURE" :
    scenario === "sead_ingress"  ? "TACTIC" :
    scenario === "migration"     ? "ROUTE" : "STRATEGY";

  return (
    <div className="pointer-events-auto inline-flex items-center gap-1 rounded-[2px] border border-[var(--color-line)] bg-[var(--color-canvas)]/85 px-1 py-0.5">
      <span className="px-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        <Crosshair className="mr-0.5 inline h-3 w-3" />
        {headerLabel}
      </span>
      {available.map((id) => {
        const meta = STRATEGY_META[id] ?? { label: id.toUpperCase(), Icon: Target, hint: id };
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            disabled={busy}
            onClick={() => set(id)}
            title={meta.hint}
            className={cn(
              "inline-flex items-center gap-1 rounded-[1px] border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] transition-colors",
              isActive
                ? "border-[var(--color-friend)] bg-[var(--color-friend)]/15 text-[var(--color-friend)]"
                : "border-transparent text-[var(--color-text-dim)] hover:border-[var(--color-line)] hover:text-[var(--color-text)]",
            )}
          >
            <meta.Icon className="h-3 w-3" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
