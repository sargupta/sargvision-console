"use client";

import { CheckCircle2, Circle, Crosshair, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useEngagementLog } from "@/lib/engagement";
import { MISSIONS, type Mission } from "@/lib/missions";
import { useSwarmStore } from "@/lib/store";

/** Missions that run a kill chain and finish when the last hostile is down. */
const COMBAT = new Set(["border_strike", "coverage"]);

export function MissionObjectives() {
  const scenario = useSwarmStore((s) => s.frame?.scenario);
  const mission = MISSIONS.find((m) => m.id === scenario);

  // `hover` is the between-mission idle state — it has no objectives at all.
  if (!mission || scenario === "hover") return null;
  if (COMBAT.has(mission.id)) return <CombatObjectives mission={mission} />;
  if (mission.id === "migration") return <TransitObjectives mission={mission} />;
  return <PostureObjectives mission={mission} />;
}

/* ── Kill-chain missions ─────────────────────────────────────────────────── */

function CombatObjectives({ mission }: { mission: Mission }) {
  const threat = useSwarmStore((s) => s.frame?.threat);
  const shield = useSwarmStore((s) => s.frame?.shield);
  const flags = useSwarmStore((s) => s.frame?.flags);
  const events = useEngagementLog((s) => s.events);

  const detected = events.filter((e) => e.phase === "detect").length;
  const classified = events.filter((e) => e.phase === "classify").length;
  const decoyed = shield?.decoys_skipped ?? 0;
  const total = threat?.total ?? 0;
  const kia = threat?.neutralized ?? 0;
  const allDown = total > 0 && (threat?.remaining ?? total) === 0;

  return (
    <Shell
      mission={mission}
      complete={allDown}
      status={
        allDown
          ? `MISSION COMPLETE — ${kia}/${total} neutralized, assets protected`
          : "ENGAGEMENT IN PROGRESS"
      }
    >
      <Objective
        done
        label="Perimeter established"
        detail="24 Sentinel UAVs in formation — leader + 4 scout + 4 relay + 15 worker"
      />
      <Objective
        done={detected >= 1}
        label={`Detect inbound (${detected}/${total})`}
        detail={detected > 0 ? "detection — sensor coherence across squadron" : "scanning…"}
      />
      <Objective
        done={classified >= 1}
        label={`Classify threats (${classified}/${total})`}
        detail={
          shield
            ? `classification · DECOY ${shield.threat_mix.decoy ?? 0} · KINETIC ${shield.threat_mix.kinetic ?? 0} · NUISANCE ${shield.threat_mix.nuisance ?? 0}`
            : "Bayesian update pending…"
        }
      />
      <Objective
        done={decoyed >= 1}
        label={`Skip decoys (${decoyed} saved)`}
        detail="trust-gate — trust × E[damage] gates ED-CBBA bids"
      />
      <Objective
        done={allDown}
        label={`Neutralize kinetic (${kia}/${total})`}
        detail={kia > 0 ? `${kia} KIA via interceptor swarm` : "auctioning targets…"}
      />
      {flags?.hijack_active && (
        <Objective
          done={false}
          warn
          label={`HIJACK INJECT — ${shield?.hijacked ?? 0} spoofed`}
          detail="sub-threshold trust drones will be kill-switched"
        />
      )}
    </Shell>
  );
}

/* ── Corridor migration ──────────────────────────────────────────────────── */

function TransitObjectives({ mission }: { mission: Mission }) {
  const mig = useSwarmStore((s) => s.frame?.migration);
  const fleet = useSwarmStore((s) => s.frame?.drones.length ?? 0);

  const zones = mig?.zones ?? [];
  const corridors = zones.filter((z) => z.kind === "corridor");
  const inTransit = corridors.reduce((n, z) => n + (z.occupancy ?? 0), 0);
  const openCorridors = corridors.filter((z) => !z.closed).length;
  const delivered = mig?.completed_loops ?? 0;
  // One "loop" per drone is a full sortie for the whole fleet.
  const complete = fleet > 0 && delivered >= fleet;

  return (
    <Shell
      mission={mission}
      complete={complete}
      status={
        complete
          ? `TRANSIT COMPLETE — ${delivered} sorties delivered, ${mig?.collisions ?? 0} collisions`
          : `MIGRATION IN PROGRESS — ${delivered} delivered`
      }
    >
      <Objective
        done
        label={`Fleet launched (${fleet} UAVs)`}
        detail="rear node cleared — per-drone corridor assignment issued"
      />
      <Objective
        done={openCorridors > 0}
        label={`Corridors open (${openCorridors}/${corridors.length})`}
        detail="per-corridor capacity + storm closure governed centrally"
      />
      <Objective
        done={inTransit > 0 || delivered > 0}
        label={`In transit (${inTransit})`}
        detail={inTransit > 0 ? "load-balanced across open corridors" : "corridor queue clear"}
      />
      <Objective
        done={delivered > 0}
        label={`Delivered to forward node (${delivered})`}
        detail={delivered > 0 ? "sorties completed end-to-end" : "no arrivals yet…"}
      />
      <Objective
        done={(mig?.collisions ?? 0) === 0}
        label={`Deconfliction held (${mig?.collisions ?? 0} collisions)`}
        detail={`${mig?.violations ?? 0} capacity violations across the run`}
      />
    </Shell>
  );
}

/* ── Sustained-posture missions (ISR patrol, perimeter mesh) ─────────────── */

function PostureObjectives({ mission }: { mission: Mission }) {
  const drones = useSwarmStore((s) => s.frame?.drones);
  const edges = useSwarmStore((s) => s.frame?.edges.length ?? 0);
  const stats = useSwarmStore((s) => s.frame?.stats);
  const shield = useSwarmStore((s) => s.frame?.shield);
  const t = useSwarmStore((s) => s.frame?.t ?? 0);

  const fleet = drones?.length ?? 0;
  const healthy = drones?.filter((d) => d.healthy).length ?? 0;
  const linkPct = fleet > 1 ? Math.min(100, Math.round((edges / (fleet * 2)) * 100)) : 0;
  // A posture mission has no terminal state — it succeeds by being SUSTAINED.
  // Treat the station as held once the mesh is up and nothing has degraded.
  const held = fleet > 0 && healthy === fleet && edges > 0;
  const label = mission.id === "flock" ? "PERIMETER HELD" : "PATROL SUSTAINED";

  return (
    <Shell
      mission={mission}
      complete={held}
      status={
        held
          ? `${label} — ${t.toFixed(0)}s on station, link integrity ${linkPct}%`
          : "ESTABLISHING STATION"
      }
    >
      <Objective
        done={fleet > 0}
        label={`Squadron on station (${healthy}/${fleet})`}
        detail="heterogeneous mix — scout + relay + striker roles assigned"
      />
      <Objective
        done={edges > 0}
        label={`Mesh established (${edges} links)`}
        detail={`link integrity ${linkPct}% — relay chain carrying the squadron`}
      />
      <Objective
        done={(stats?.msgs_per_s ?? 0) > 0}
        label={`Comms nominal (${Math.round(stats?.msgs_per_s ?? 0)} msg/s)`}
        detail="A2A + ZENOH + MAVLINK across the mesh"
      />
      <Objective
        done={(shield?.hijacked ?? 0) === 0}
        label={`Trust intact (${shield?.loyal ?? healthy}/${fleet} loyal)`}
        detail={
          (shield?.hijacked ?? 0) > 0
            ? `${shield?.hijacked} drone(s) flagged — kill-switch armed`
            : "no spoofed members — Byzantine fusion clean"
        }
      />
      <Objective
        done={held}
        label="Coverage sustained"
        detail="GNSS-denied hold — vision SLAM carrying navigation"
      />
    </Shell>
  );
}

/* ── Shared chrome ───────────────────────────────────────────────────────── */

function Shell({
  mission,
  complete,
  status,
  children,
}: {
  mission: Mission;
  complete: boolean;
  status: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1 px-3 py-2 font-mono text-[10.5px]">
      <header className="flex items-baseline justify-between border-b border-[var(--color-line)] pb-1.5">
        <span className="inline-flex items-center gap-1.5 uppercase tracking-[0.18em] text-[var(--color-saffron)]">
          <Crosshair className="h-3 w-3" />
          MISSION · {mission.short}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
          {mission.idex_ref} · ₹{mission.ticket_inr_cr} cr
        </span>
      </header>

      {children}

      <footer
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 rounded-[1px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.22em]",
          complete
            ? "border-[var(--color-status-ok)]/50 bg-[var(--color-status-ok)]/10 text-[var(--color-status-ok)]"
            : "border-[var(--color-status-warn)]/40 bg-[var(--color-status-warn)]/8 text-[var(--color-status-warn)]",
        )}
      >
        <ShieldCheck className="h-3 w-3" />
        STATUS · {status}
      </footer>
    </section>
  );
}

function Objective({
  done,
  warn,
  label,
  detail,
}: {
  done: boolean;
  warn?: boolean;
  label: string;
  detail: string;
}) {
  const color = warn
    ? "var(--color-hostile)"
    : done
      ? "var(--color-status-ok)"
      : "var(--color-text-dim)";
  const Icon = done ? CheckCircle2 : Circle;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3 w-3 flex-none" style={{ color }} />
      <div className="flex flex-1 flex-col">
        <span style={{ color }}>{label}</span>
        <span className="text-[9.5px] text-[var(--color-text-vdim)]">{detail}</span>
      </div>
    </div>
  );
}
