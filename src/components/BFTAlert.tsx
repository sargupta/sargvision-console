"use client";

import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import type { BFTEvent } from "@/lib/types";

const TTL_MS = 4500;

export function BFTAlert() {
  const events = useSwarmStore((s) => s.frame?.bft_events);
  const [active, setActive] = useState<BFTEvent | null>(null);
  const lastTRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!events || events.length === 0) return;
    const latest = events[events.length - 1];
    if (latest.t <= lastTRef.current) return;
    lastTRef.current = latest.t;
    setActive(latest);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setActive(null), TTL_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [events]);

  if (!active) return null;

  const total = active.yes + active.no;
  const yesPct = total === 0 ? 0 : (active.yes / total) * 100;
  const passed = active.passed;
  const byz = active.byzantine ?? [];

  return (
    <div className="pointer-events-auto absolute left-1/2 top-16 z-40 w-[420px] -translate-x-1/2">
      <div
        className={cn(
          "overflow-hidden rounded-[2px] border bg-[var(--color-canvas)]/95 backdrop-blur-sm",
          passed
            ? "border-[var(--color-status-ok)]/50"
            : "border-[var(--color-status-crit)]/60",
        )}
      >
        <header
          className={cn(
            "flex items-center justify-between px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]",
            passed
              ? "bg-[var(--color-status-ok)]/10 text-[var(--color-status-ok)]"
              : "bg-[var(--color-status-crit)]/15 text-[var(--color-status-crit)]",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> SwarmRaft · BFT vote
          </span>
          <span className="tabular-nums">t = {active.t.toFixed(2)} s</span>
        </header>

        <div className="px-3 py-2">
          <div className="font-mono text-[12px] text-[var(--color-text)]">
            {active.proposal}
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            {passed ? (
              <CheckCircle2 className="h-3 w-3 text-[var(--color-status-ok)]" />
            ) : (
              <XCircle className="h-3 w-3 text-[var(--color-status-crit)]" />
            )}
            <span className={passed ? "text-[var(--color-status-ok)]" : "text-[var(--color-status-crit)]"}>
              {passed ? "PASSED" : "FAILED"}
            </span>
            <span>·</span>
            <span>{active.yes} / {total} yes</span>
            {byz.length > 0 && (
              <>
                <span>·</span>
                <span className="text-[var(--color-status-warn)]">
                  byz {byz.map((b) => String(b).padStart(3, "0")).join(",")}
                </span>
              </>
            )}
          </div>

          <div className="mt-2 h-2 w-full rounded-[1px] bg-[var(--color-line)]">
            <div
              className="h-2 rounded-[1px] transition-[width] duration-1000 ease-out"
              style={{
                width: `${yesPct}%`,
                background: passed
                  ? "var(--color-status-ok)"
                  : "var(--color-status-crit)",
              }}
            />
          </div>

          <div className="mt-2 flex gap-1">
            {active.voters.map((v) => {
              const isByz = byz.includes(v);
              return (
                <span
                  key={v}
                  className={cn(
                    "flex h-5 w-9 items-center justify-center rounded-[1px] border font-mono text-[9px] tabular-nums",
                    isByz
                      ? "border-[var(--color-status-warn)]/60 bg-[var(--color-status-warn)]/15 text-[var(--color-status-warn)]"
                      : passed
                        ? "border-[var(--color-status-ok)]/40 bg-[var(--color-status-ok)]/10 text-[var(--color-status-ok)]"
                        : "border-[var(--color-status-crit)]/40 bg-[var(--color-status-crit)]/10 text-[var(--color-status-crit)]",
                  )}
                >
                  {String(v).padStart(3, "0")}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
