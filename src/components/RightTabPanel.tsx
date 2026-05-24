"use client";

/** RightTabPanel — single consolidated right rail with tabs for SHIELD / Vajra
 *  / Migration / Inspector. Replaces 4 floating panels that used to compete.
 *
 *  Self-contained — reads from useSwarmStore directly so it doesn't depend on
 *  the existing panel components' internal layout.
 */

import {
  AlertTriangle,
  Battery,
  Brain,
  Compass,
  Crosshair,
  Mountain,
  Network,
  Plane,
  Radio,
  Repeat,
  ShieldCheck,
  Skull,
  Target,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ChanakyaPanel } from "@/components/ChanakyaPanel";
import { EngagementTimeline } from "@/components/EngagementTimeline";
import { MayaPanel } from "@/components/MayaPanel";
import { SheshnagPanel } from "@/components/SheshnagPanel";
import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";

const HTTP_URL = process.env.NEXT_PUBLIC_SWARM_HTTP_URL ?? "http://127.0.0.1:8765";

type TabId = "inspector" | "shield" | "vajra" | "maya" | "sheshnag" | "chanakya" | "kills" | "migration";

export function RightTabPanel() {
  const selected = useSwarmStore((s) => s.selectedDroneId);
  const select = useSwarmStore((s) => s.select);
  const frame = useSwarmStore((s) => s.frame);

  const [tab, setTab] = useState<TabId>("shield");

  useEffect(() => {
    if (selected != null) setTab("inspector");
  }, [selected]);

  useEffect(() => {
    if (frame?.scenario === "migration" && selected == null) setTab("migration");
  }, [frame?.scenario, selected]);

  const shield = frame?.shield;
  const vajra = frame?.vajra;
  const maya = frame?.maya;
  const sheshnag = frame?.sheshnag;
  const chanakya = frame?.chanakya;
  const mig = frame?.migration;

  const tabs = ([
    { id: "inspector", label: "Asset", Icon: Crosshair, show: selected != null },
    { id: "shield", label: "SHIELD", Icon: ShieldCheck, show: !!shield },
    { id: "vajra", label: "Vajra", Icon: Zap, show: !!vajra },
    { id: "maya", label: "Maya", Icon: Brain, show: !!maya },
    { id: "sheshnag", label: "Sheshnag", Icon: Radio, show: !!sheshnag },
    { id: "chanakya", label: "Chanakya", Icon: Compass, show: !!chanakya },
    { id: "kills", label: "Kills", Icon: Skull, show: true },
    { id: "migration", label: "Migration", Icon: Mountain, show: !!mig },
  ] satisfies { id: TabId; label: string; Icon: typeof ShieldCheck; show: boolean }[]).filter((t) => t.show);

  return (
    <aside className="flex h-full w-full flex-col">
      <div className="flex shrink-0 border-b border-[var(--color-line)] bg-[var(--color-elevated)]/40">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors",
                active
                  ? "border-[var(--color-friend)] bg-[var(--color-canvas)] text-[var(--color-friend)]"
                  : "border-transparent text-[var(--color-text-dim)] hover:bg-[var(--color-elevated)]/60 hover:text-[var(--color-text)]",
              )}
            >
              <t.Icon className="h-3 w-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="scrollbar-hidden flex-1 overflow-y-auto p-3">
        {tab === "inspector" && <InspectorBody onClose={() => select(null)} />}
        {tab === "shield" && <ShieldBody />}
        {tab === "vajra" && <VajraBody />}
        {tab === "maya" && <MayaPanel />}
        {tab === "sheshnag" && <SheshnagPanel />}
        {tab === "chanakya" && <ChanakyaPanel />}
        {tab === "kills" && <EngagementTimeline />}
        {tab === "migration" && <MigrationBody />}
      </div>
    </aside>
  );
}

// ── Inspector body ────────────────────────────────────────────────────

import type { WireMessageEvent } from "@/lib/types";
const EMPTY_RECENT: ReadonlyArray<WireMessageEvent> = [];

function InspectorBody({ onClose }: { onClose: () => void }) {
  const selectedId = useSwarmStore((s) => s.selectedDroneId);
  const frame = useSwarmStore((s) => s.frame);
  const drone = useMemo(
    () =>
      selectedId == null
        ? null
        : frame?.drones.find((d) => d.id === selectedId) ?? null,
    [selectedId, frame],
  );
  const recent = useMemo(() => {
    if (selectedId == null || !frame) return EMPTY_RECENT;
    return frame.recent_messages
      .filter((m) => m.src === selectedId || m.dst === selectedId)
      .slice(-8)
      .reverse();
  }, [selectedId, frame]);

  if (!drone) return <div className="text-[10.5px] text-[var(--color-text-vdim)]">No drone selected</div>;

  const battPct = Math.round(drone.battery * 100);
  const battColor =
    battPct < 25 ? "var(--color-status-warn)" : battPct < 50 ? "var(--color-status-caution)" : "var(--color-status-ok)";

  return (
    <div className="font-mono text-[11px]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            DRN-{String(drone.id).padStart(3, "0")}
          </div>
          <div className="mt-0.5 text-[14px] tracking-[0.05em] text-[var(--color-text)]">
            {drone.platform}
          </div>
          <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            {drone.affiliation} · {drone.role} · {drone.healthy ? "NOMINAL" : "DEGRADED"}
          </div>
          <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-saffron)]">
            NavIC + GPS · BSD-3 PX4 fork
          </div>
        </div>
        <button onClick={onClose} className="rounded-[2px] border border-[var(--color-line)] p-1 text-[10px] text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
          ✕
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-1.5">
        <Stat Icon={Battery} label="Battery" value={`${battPct}%`} color={battColor} bar={drone.battery} />
        <Stat Icon={Crosshair} label="Vel" value={`${drone.vel_ms.toFixed(2)} m/s`} />
        <Stat Icon={Crosshair} label="Heading" value={`${drone.heading_deg.toFixed(0)}°`} />
        <Stat Icon={Crosshair} label="Alt" value={`${drone.alt_m.toFixed(1)} m`} />
      </div>

      <div className="mb-3 rounded-[2px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 px-2 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        <Row label="LAT" value={drone.lat.toFixed(6)} />
        <Row label="LON" value={drone.lon.toFixed(6)} />
      </div>

      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        Task
      </div>
      <div className="mb-3 rounded-[2px] border border-[var(--color-friend)]/40 bg-[var(--color-friend)]/8 px-2 py-1 text-[11px] text-[var(--color-friend)]">
        {drone.task ?? drone.intent}
      </div>

      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        Recent comms
      </div>
      <ul className="space-y-0.5">
        {recent.length === 0 && <li className="text-[10px] text-[var(--color-text-vdim)]">none yet.</li>}
        {recent.map((m, i) => (
          <li key={i} className="flex items-baseline gap-2 text-[10px]">
            <span className="tabular-nums text-[var(--color-text-vdim)]">{m.t.toFixed(2)}</span>
            <span className="text-[var(--color-friend)] uppercase tracking-[0.15em]">{m.protocol}</span>
            <span className="truncate text-[var(--color-text-dim)]">{m.summary}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── SHIELD body ───────────────────────────────────────────────────────

function ShieldBody() {
  const shield = useSwarmStore((s) => s.frame?.shield);
  const flags = useSwarmStore((s) => s.frame?.flags);
  if (!shield) return null;
  const total = shield.loyal + shield.suspect + shield.hijacked + shield.kill_switched;
  const hijack = flags?.hijack_active ?? shield.hijack_active;

  async function toggleHijack() {
    await fetch(`${HTTP_URL}/hijack/toggle`, { method: "POST" });
  }

  return (
    <div className="font-mono text-[11px]">
      <header className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]">
        <span className="text-[var(--color-friend)]">5-LAYER DEFENDER</span>
        <button
          type="button"
          onClick={toggleHijack}
          className={cn(
            "rounded-[2px] border px-1.5 py-0.5 transition-colors",
            hijack
              ? "border-[var(--color-hostile)]/60 bg-[var(--color-hostile)]/15 text-[var(--color-hostile)]"
              : "border-[var(--color-line)] text-[var(--color-text-dim)] hover:border-[var(--color-status-warn)]/40 hover:text-[var(--color-status-warn)]",
          )}
        >
          <Skull className="mr-1 inline h-3 w-3" />
          {hijack ? "HIJACK ON" : "INJECT HIJACK"}
        </button>
      </header>

      <div className="mb-3">
        <div className="mb-1 flex items-baseline justify-between text-[10px] text-[var(--color-text-vdim)] uppercase tracking-[0.18em]">
          <span>Friendlies · loyalty</span>
          <span className="tabular-nums text-[var(--color-text)]">{shield.loyal}/{total}</span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-[1px] bg-[var(--color-line)]">
          <div className="h-full bg-[var(--color-status-ok)]" style={{ width: `${(shield.loyal / total) * 100}%` }} />
          <div className="h-full bg-[var(--color-status-caution)]" style={{ width: `${(shield.suspect / total) * 100}%` }} />
          <div className="h-full bg-[var(--color-hostile)]" style={{ width: `${(shield.hijacked / total) * 100}%` }} />
          <div className="h-full bg-[var(--color-text-vdim)]" style={{ width: `${(shield.kill_switched / total) * 100}%` }} />
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-[9.5px] tabular-nums">
          <span className="text-[var(--color-status-ok)]">LOYAL {shield.loyal}</span>
          <span className="text-[var(--color-status-caution)]">SUSPECT {shield.suspect}</span>
          <span className="text-[var(--color-hostile)]">HIJACKED {shield.hijacked}</span>
          <span className="text-[var(--color-text-vdim)]">KILL-SW {shield.kill_switched}</span>
        </div>
      </div>

      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        Hostiles · Bayesian threat class
      </div>
      <div className="mb-3 flex gap-1.5">
        {(["decoy", "kinetic", "nuisance"] as const).map((c) => {
          const color =
            c === "decoy" ? "var(--color-status-caution)"
              : c === "kinetic" ? "var(--color-hostile)"
                : "var(--color-text-dim)";
          return (
            <div
              key={c}
              className="flex-1 rounded-[1px] border px-1.5 py-0.5"
              style={{ borderColor: `${color}50`, background: `${color}12`, color }}
            >
              {c.toUpperCase()} {shield.threat_mix[c] ?? 0}
            </div>
          );
        })}
      </div>

      <div className="rounded-[1px] border border-[var(--color-status-warn)]/30 bg-[var(--color-status-warn)]/8 px-2 py-1 text-[10px] text-[var(--color-status-warn)]">
        <Zap className="mr-1 inline h-3 w-3" />
        DECOYS SKIPPED · <span className="tabular-nums">{shield.decoys_skipped}</span> · munition saved
      </div>
    </div>
  );
}

// ── Vajra body ────────────────────────────────────────────────────────

function VajraBody() {
  const vajra = useSwarmStore((s) => s.frame?.vajra);
  if (!vajra) return null;
  const fragmented = vajra.fragmented;
  const lambdaPct = Math.min(1, vajra.lambda2 / 0.6);
  const owners = Object.keys(vajra.voronoi_owners).length;

  return (
    <div className="font-mono text-[11px]">
      <header className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]">
        <span className="text-[var(--color-saffron)]">STRIKE DOCTRINE</span>
        <span className={cn(
          "rounded-[1px] border px-1.5 py-0.5",
          fragmented
            ? "border-[var(--color-hostile)]/60 bg-[var(--color-hostile)]/15 text-[var(--color-hostile)]"
            : "border-[var(--color-status-ok)]/40 bg-[var(--color-status-ok)]/8 text-[var(--color-status-ok)]",
        )}>
          {fragmented ? "FRAGMENTED" : "CONNECTED"}
        </span>
      </header>

      <div className="mb-3">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
          <span><Network className="mr-1 inline h-3 w-3" />λ₂ Fiedler</span>
          <span className="tabular-nums text-[var(--color-text)]">{vajra.lambda2.toFixed(3)}</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-[1px] bg-[var(--color-line)]">
          <div
            className="h-1.5 rounded-[1px] transition-[width] duration-200"
            style={{
              width: `${Math.round(lambdaPct * 100)}%`,
              background: fragmented ? "var(--color-hostile)" : vajra.lambda2 < 0.05 ? "var(--color-status-warn)" : "var(--color-status-ok)",
            }}
          />
        </div>
        <div className="mt-1 text-[9px] text-[var(--color-text-vdim)]">
          higher = more resilient · alarm if &lt; {vajra.fragmentation_threshold.toFixed(3)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <Stat Icon={Network} label="Components" value={vajra.n_components.toString()} color={vajra.n_components > 1 ? "var(--color-hostile)" : "var(--color-status-ok)"} />
        <Stat Icon={Target} label="Voronoi" value={`${owners}/${vajra.n_hostiles_alive}`} color="var(--color-saffron)" />
        <Stat Icon={Repeat} label="Handovers" value={vajra.handover_count.toString()} color="var(--color-text-dim)" />
      </div>

      {vajra.jamming_factor > 0 && (
        <div className="mt-2 rounded-[1px] border border-[var(--color-status-warn)]/40 bg-[var(--color-status-warn)]/8 px-2 py-1 text-[10px] text-[var(--color-status-warn)]">
          <AlertTriangle className="mr-1 inline h-3 w-3" />
          EW jamming · factor {vajra.jamming_factor.toFixed(2)}
        </div>
      )}
    </div>
  );
}

// ── Migration body ────────────────────────────────────────────────────

function MigrationBody() {
  const mig = useSwarmStore((s) => s.frame?.migration);
  if (!mig) return null;
  const tp = mig.throughput_per_min ?? {};
  const corridors = mig.zones.filter((z) => z.kind === "corridor");

  async function toggleJam() { await fetch(`${HTTP_URL}/jam`, { method: "POST" }); }
  async function toggleGnss() { await fetch(`${HTTP_URL}/gnss/toggle`, { method: "POST" }); }

  return (
    <div className="font-mono text-[11px]">
      <header className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]">
        <span className="text-[var(--color-saffron)]">GOVERNED MIGRATION</span>
        <span className="text-[var(--color-text-dim)] tabular-nums">loops {mig.completed_loops}</span>
      </header>

      <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        Corridors · occupancy / throughput
      </div>
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {corridors.map((z) => {
          const cnt = tp[z.id] ?? 0;
          const load = z.capacity > 0 ? z.occupancy / z.capacity : 0;
          const hot = load >= 0.8;
          const closed = !!z.closed;
          return (
            <div
              key={z.id}
              className={cn(
                "rounded-[1px] border px-1.5 py-1",
                closed
                  ? "border-[var(--color-hostile)]/60 bg-[var(--color-hostile)]/10"
                  : "border-[var(--color-line)] bg-[var(--color-elevated)]/40",
              )}
            >
              <div className="text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
                {z.name.split(" · ")[0]}
              </div>
              {closed ? (
                <div className="text-[var(--color-hostile)] uppercase tracking-[0.18em]">CLOSED</div>
              ) : (
                <div className="flex items-baseline justify-between gap-1">
                  <span className={cn("tabular-nums", hot ? "text-[var(--color-status-warn)]" : "text-[var(--color-friend)]")}>
                    {z.occupancy}/{z.capacity}
                  </span>
                  <span className="text-[9px] tabular-nums text-[var(--color-text-dim)]">{cnt}/min</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <Stat Icon={AlertTriangle} label="Violations" value={mig.violations.toString()} color={mig.violations > 0 ? "var(--color-hostile)" : "var(--color-status-ok)"} />
        <Stat Icon={Repeat} label="Loops" value={mig.completed_loops.toString()} color="var(--color-friend)" />
        <Stat Icon={Target} label="Σ thru/min" value={Object.values(tp).reduce((a, b) => a + b, 0).toString()} color="var(--color-status-ok)" />
      </div>

      <div className="mt-3 flex gap-1.5">
        <button onClick={toggleJam} className="flex-1 rounded-[1px] border border-[var(--color-line)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-dim)] hover:text-[var(--color-status-warn)] hover:border-[var(--color-status-warn)]/40">
          Toggle JAM
        </button>
        <button onClick={toggleGnss} className="flex-1 rounded-[1px] border border-[var(--color-line)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-dim)] hover:text-[var(--color-status-warn)] hover:border-[var(--color-status-warn)]/40">
          Toggle GNSS-DENIED
        </button>
      </div>

      {(mig.closure_events ?? []).length > 0 && (
        <>
          <div className="mt-3 mb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            Recent closures
          </div>
          <ul className="space-y-0.5 text-[10px]">
            {(mig.closure_events ?? []).slice(-5).reverse().map((ev, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="tabular-nums text-[var(--color-text-vdim)]">{ev.t.toFixed(1)}</span>
                <span className={ev.kind === "closed" ? "text-[var(--color-hostile)]" : "text-[var(--color-status-ok)]"}>
                  {ev.kind.toUpperCase()}
                </span>
                <span className="text-[var(--color-text-dim)]">{ev.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function Stat({
  Icon, label, value, color, bar,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
  bar?: number;
}) {
  return (
    <div className="rounded-[1px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 px-1.5 py-0.5">
      <div className="inline-flex items-center gap-1 text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className="tabular-nums" style={{ color: color ?? "var(--color-text)" }}>{value}</div>
      {bar != null && (
        <div className="mt-0.5 h-1 w-full rounded-[1px] bg-[var(--color-line)]">
          <div className="h-1 rounded-[1px]" style={{ width: `${Math.round(bar * 100)}%`, background: color ?? "var(--color-friend)" }} />
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
