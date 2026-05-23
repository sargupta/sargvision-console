"use client";

import {
  Battery,
  CheckCircle2,
  Crosshair,
  Repeat,
  ShieldOff,
  Skull,
  Sparkles,
  Target,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { useEngagementLog } from "@/lib/engagement";
import { useSwarmStore } from "@/lib/store";

/** Mission post-mortem modal — pops when mission completes (counter-swarm
 *  hostiles all KIA) or migration reaches a loop milestone (every 10 loops).
 *  Operator-dismissible. Shows operational summary suitable for an iDEX brief.
 */
export function PostMortem() {
  const frame = useSwarmStore((s) => s.frame);
  const events = useEngagementLog((s) => s.events);
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  // Build the post-mortem trigger key — fires once per (scenario, milestone)
  const triggerKey = (() => {
    if (!frame) return null;
    const sc = frame.scenario;
    if (sc === "coverage") {
      const t = frame.threat;
      if (t && t.total > 0 && t.remaining === 0) return `${sc}-allkia`;
    }
    if (sc === "migration") {
      const loops = frame.migration?.completed_loops ?? 0;
      if (loops > 0 && loops % 10 === 0) return `${sc}-${loops}loops`;
    }
    return null;
  })();

  useEffect(() => {
    if (triggerKey && triggerKey !== dismissed && !shown) {
      setShown(true);
    }
  }, [triggerKey, dismissed, shown]);

  if (!shown || !frame || !triggerKey) return null;

  // Compute summary stats
  const threat = frame.threat;
  const shield = frame.shield;
  const mig = frame.migration;
  const elapsed = frame.t;

  const kias = events.filter((e) => e.phase === "kia");
  const decoysSkipped = events.filter((e) => e.phase === "decoy_skipped").length;
  const bftCount = (frame.bft_events ?? []).length;
  const totalMsgs = frame.stats.total_msgs;

  // Battery histogram (5 buckets)
  const buckets = [0, 0, 0, 0, 0];
  for (const d of frame.drones) {
    const idx = Math.min(4, Math.floor(d.battery * 5));
    buckets[idx]++;
  }
  const battColors = ["#FF4D5E", "#FF8A1F", "#FFC83D", "#4AE6A0", "#00C2FF"];
  const battLabels = ["0-20%", "20-40%", "40-60%", "60-80%", "80-100%"];

  function close() {
    setDismissed(triggerKey);
    setShown(false);
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-canvas)]/85 backdrop-blur-md">
      <div className="flex w-[760px] max-w-[92vw] flex-col rounded-[2px] border border-[var(--color-status-ok)]/45 bg-[var(--color-canvas)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--color-status-ok)]/40 px-5 py-3">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--color-status-ok)]">
              // POST-MORTEM
            </div>
            <div className="mt-0.5 font-mono text-[15px] tracking-[0.05em] text-[var(--color-text)]">
              {frame.scenario === "coverage"
                ? "IAF Counter-Swarm Intercept · MISSION COMPLETE"
                : `Governed Migration · ${mig?.completed_loops ?? 0} LOOPS COMPLETE`}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
              elapsed t = {elapsed.toFixed(2)}s · {totalMsgs.toLocaleString()} wire messages
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-[2px] border border-[var(--color-line)] p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-elevated)]/60 hover:text-[var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-2 gap-x-5 gap-y-3 px-5 py-4 font-mono text-[11px]">
          {/* Headline counters */}
          {threat && (
            <Stat
              Icon={Target}
              label="KIA"
              value={`${threat.neutralized}/${threat.total}`}
              tint="var(--color-status-ok)"
            />
          )}
          {shield && (
            <Stat
              Icon={ShieldOff}
              label="Decoys skipped"
              value={decoysSkipped.toString()}
              tint="var(--color-status-caution)"
            />
          )}
          <Stat
            Icon={Sparkles}
            label="BFT votes"
            value={bftCount.toString()}
            tint="var(--color-friend)"
          />
          {mig && (
            <Stat
              Icon={Repeat}
              label="Loops completed"
              value={mig.completed_loops.toString()}
              tint="var(--color-saffron)"
            />
          )}
          <Stat
            Icon={Timer}
            label="Sim time"
            value={`${elapsed.toFixed(1)}s`}
            tint="var(--color-text-dim)"
          />
          <Stat
            Icon={Crosshair}
            label="Bandwidth"
            value={`${frame.stats.msgs_per_s.toFixed(0)} msg/s`}
            tint="var(--color-text-dim)"
          />
        </div>

        {/* KIA log */}
        {kias.length > 0 && (
          <section className="border-t border-[var(--color-line)] px-5 py-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
              KIA log · {kias.length} hostiles neutralized
            </div>
            <ul className="scrollbar-hidden max-h-32 overflow-y-auto font-mono text-[10.5px]">
              {kias.map((k, i) => (
                <li
                  key={i}
                  className="flex items-baseline gap-2 border-b border-[var(--color-line)]/40 px-1 py-0.5"
                >
                  <Skull className="h-3 w-3 text-[var(--color-hostile)]" />
                  <span className="w-12 tabular-nums text-[var(--color-text-vdim)]">
                    {k.t.toFixed(1)}
                  </span>
                  <span className="w-20 text-[var(--color-hostile)]">
                    {k.hostile_callsign}
                  </span>
                  <span className="text-[var(--color-text-dim)]">
                    by DRN-{String(k.drone_id).padStart(3, "0")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Battery histogram */}
        <section className="border-t border-[var(--color-line)] px-5 py-3">
          <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            <Battery className="h-3 w-3" />
            Fleet battery state · {frame.drones.length} drones
          </div>
          <div className="flex items-end gap-1">
            {buckets.map((n, i) => {
              const max = Math.max(...buckets, 1);
              const heightPct = (n / max) * 100;
              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="relative flex h-20 w-full items-end">
                    <div
                      className="w-full rounded-t-[1px] transition-[height] duration-300"
                      style={{ height: `${heightPct}%`, background: battColors[i] }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[9px] tabular-nums text-[var(--color-text)]">
                    {n}
                  </div>
                  <div className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[var(--color-text-vdim)]">
                    {battLabels[i]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-[var(--color-line)] bg-[var(--color-elevated)]/30 px-5 py-2">
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--color-status-ok)]/60 bg-[var(--color-status-ok)]/12 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--color-status-ok)] hover:bg-[var(--color-status-ok)]/20"
          >
            <CheckCircle2 className="h-3 w-3" />
            Acknowledge
          </button>
        </footer>
      </div>
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
  tint,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[2px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 px-3 py-2">
      <span className="inline-flex items-center gap-1.5 text-[var(--color-text-dim)]">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="font-mono text-[13px] tabular-nums" style={{ color: tint }}>
        {value}
      </span>
    </div>
  );
}
