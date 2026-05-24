"use client";

import { useMemo } from "react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import type { WireMessageEvent } from "@/lib/types";

const EMPTY_MSGS: WireMessageEvent[] = [];

const PROTOCOL_HEX: Record<string, string> = {
  A2A: "#A78BFA",
  Zenoh: "#00C2FF",
  MAVLink: "#4AE6A0",
  BFT: "#FF4D5E",
  gRPC: "#FF8A1F",
  MCP: "#F472B6",
  DDS: "#00C2FF",
};

export function CommsLog() {
  const messages = useSwarmStore((s) => s.frame?.recent_messages ?? EMPTY_MSGS);
  const stats = useSwarmStore((s) => s.frame?.stats);

  const tail = useMemo(() => messages.slice(-40).reverse(), [messages]);

  return (
    <section className="pointer-events-auto absolute bottom-0 left-72 right-[26rem] z-10 hidden md:flex h-32 flex-col border-t border-[var(--color-line)] bg-[var(--color-canvas)]/92 backdrop-blur-sm" data-mobile-panel="wirelog">
      <header className="flex items-baseline justify-between border-b border-[var(--color-line)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="text-[var(--color-text-vdim)]">Wire log · live</span>
        <div className="flex items-center gap-3 text-[var(--color-text-dim)]">
          {stats?.by_protocol &&
            Object.entries(stats.by_protocol).map(([proto, n]) => (
              <span key={proto} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-[1px]"
                  style={{ background: PROTOCOL_HEX[proto] ?? "#888" }}
                />
                <span>{proto}</span>
                <span className="tabular-nums text-[var(--color-text)]">{n.toLocaleString()}</span>
              </span>
            ))}
        </div>
      </header>
      <div className="scrollbar-hidden flex-1 overflow-y-auto font-mono text-[10.5px]">
        {tail.map((m, i) => (
          <div
            key={`${m.t}-${i}`}
            className="flex items-baseline gap-2 border-b border-[var(--color-line)]/40 px-3 py-0.5 hover:bg-[var(--color-elevated)]/30"
          >
            <span className="w-12 shrink-0 tabular-nums text-[var(--color-text-vdim)]">
              {m.t.toFixed(2)}
            </span>
            <span
              className={cn("w-14 shrink-0 uppercase tracking-[0.18em]")}
              style={{ color: PROTOCOL_HEX[m.protocol] ?? "#888" }}
            >
              {m.protocol}
            </span>
            <span className="w-14 shrink-0 tabular-nums text-[var(--color-text-dim)]">
              {String(m.src).padStart(3, "0")}
              <span className="text-[var(--color-text-vdim)]">→</span>
              {m.dst == null ? "*" : String(m.dst).padStart(3, "0")}
            </span>
            <span className="w-16 shrink-0 tabular-nums text-[var(--color-text-vdim)]">
              {m.bytes}B
            </span>
            <span className="truncate text-[var(--color-text-dim)]">{m.summary}</span>
          </div>
        ))}
        {tail.length === 0 && (
          <div className="px-3 py-2 text-[var(--color-text-vdim)]">No traffic yet.</div>
        )}
      </div>
    </section>
  );
}
