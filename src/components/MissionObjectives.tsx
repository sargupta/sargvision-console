"use client";

import { CheckCircle2, Circle, Crosshair, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/cn";
import { useEngagementLog } from "@/lib/engagement";
import { MISSIONS } from "@/lib/missions";
import { useSwarmStore } from "@/lib/store";

export function MissionObjectives() {
  const scenario = useSwarmStore((s) => s.frame?.scenario);
  const threat = useSwarmStore((s) => s.frame?.threat);
  const shield = useSwarmStore((s) => s.frame?.shield);
  const events = useEngagementLog((s) => s.events);
  const flags = useSwarmStore((s) => s.frame?.flags);

  const mission = MISSIONS.find((m) => m.id === scenario);
  if (!mission || scenario === "hover") return null;

  const detected = events.filter((e) => e.phase === "detect").length;
  const classified = events.filter((e) => e.phase === "classify").length;
  const decoyed = shield?.decoys_skipped ?? 0;
  const total = threat?.total ?? 0;
  const kia = threat?.neutralized ?? 0;
  const remaining = threat?.remaining ?? total;
  const allDown = total > 0 && remaining === 0;

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

      <Objective
        done
        label="Perimeter established"
        detail="24 ALFA-S in vyuha — leader + 4 scout + 4 relay + 15 worker"
      />
      <Objective
        done={detected >= 1}
        label={`Detect inbound (${detected}/${total})`}
        detail={detected > 0 ? "drishti — sensor coherence across squadron" : "scanning…"}
      />
      <Objective
        done={classified >= 1}
        label={`Classify threats (${classified}/${total})`}
        detail={
          shield
            ? `prajna · DECOY ${shield.threat_mix.decoy ?? 0} · KINETIC ${shield.threat_mix.kinetic ?? 0} · NUISANCE ${shield.threat_mix.nuisance ?? 0}`
            : "Bayesian update pending…"
        }
      />
      <Objective
        done={decoyed >= 1}
        label={`Skip decoys (${decoyed} saved)`}
        detail="yukti — trust × E[damage] gates ED-CBBA bids"
      />
      <Objective
        done={kia >= 1}
        label={`Neutralize kinetic (${kia}/${total})`}
        detail={kia > 0 ? `${kia} KIA via interceptor swarm` : "auctioning targets…"}
      />
      {flags?.hijack_active && (
        <Objective
          done={false}
          warn
          label={`HIJACK INJECT — ${shield?.hijacked ?? 0} spoofed`}
          detail="tyaga — sub-threshold trust drones will be kill-switched"
        />
      )}

      <footer
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 rounded-[1px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.22em]",
          allDown
            ? "border-[var(--color-status-ok)]/50 bg-[var(--color-status-ok)]/10 text-[var(--color-status-ok)]"
            : "border-[var(--color-status-warn)]/40 bg-[var(--color-status-warn)]/8 text-[var(--color-status-warn)]",
        )}
      >
        <ShieldCheck className="h-3 w-3" />
        STATUS · {allDown ? "MISSION COMPLETE — all threats neutralized" : "ENGAGEMENT IN PROGRESS"}
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
