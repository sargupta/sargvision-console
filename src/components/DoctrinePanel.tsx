"use client";

import { BookOpen, X } from "lucide-react";
import { useState } from "react";

import { DOCTRINES, type Doctrine } from "@/lib/doctrine";

const LAYER_COLOR: Record<Doctrine["layer"], string> = {
  command: "var(--color-saffron)",
  shield: "var(--color-friend)",
  reflex: "var(--color-status-ok)",
  allocation: "var(--color-status-caution)",
  consensus: "var(--color-hostile)",
  comms: "#A78BFA",
  nav: "#06B6D4",
  ew: "var(--color-status-warn)",
};

const LAYER_LABEL: Record<Doctrine["layer"], string> = {
  command: "Command Doctrine",
  shield: "SHIELD — 5-layer defender",
  reflex: "Reflex — vyuha + raksha paridhi",
  allocation: "Task allocation — yajna",
  consensus: "Consensus — sabha",
  comms: "Comms — samvaad",
  nav: "Navigation — nakshatra-rahit marg",
  ew: "Electronic warfare — ravi-nirodh",
};

export function DoctrinePanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute right-3 top-32 z-20 inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--color-saffron)]/40 bg-[var(--color-canvas)]/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-saffron)] backdrop-blur-sm hover:bg-[var(--color-saffron)]/15"
        title="Open Chanakya Doctrine — every algorithm running with its math + Indian doctrinal name + arXiv source"
      >
        <BookOpen className="h-3 w-3" />
        Doctrine
      </button>
    );
  }

  // Group by layer
  const grouped: Record<Doctrine["layer"], Doctrine[]> = {
    command: [],
    shield: [],
    reflex: [],
    allocation: [],
    consensus: [],
    comms: [],
    nav: [],
    ew: [],
  };
  for (const d of DOCTRINES) grouped[d.layer].push(d);

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-[var(--color-canvas)]/95 backdrop-blur-md">
      <div className="flex w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-saffron)]/30 px-6 py-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-saffron)]">
              चाणक्य नीति · Chanakya Doctrine
            </div>
            <div className="mt-0.5 font-mono text-[13px] tracking-[0.06em] text-[var(--color-text)]">
              Every algorithm running inside SARGVISION — math, Sanskrit, citation
            </div>
            <div className="mt-1 max-w-[60ch] font-mono text-[10.5px] text-[var(--color-text-dim)]">
              Algorithms in isolation are public commodity. Composition + Indian-terrain
              training data is the moat. Below is the full stack you can verify against
              Arthashastra, modern arXiv papers, and the running engine.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[2px] border border-[var(--color-line)] p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-elevated)]/60 hover:text-[var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="scrollbar-hidden flex-1 overflow-y-auto px-6 py-4">
          {(Object.keys(grouped) as Doctrine["layer"][]).map((layer) => {
            const items = grouped[layer];
            if (items.length === 0) return null;
            return (
              <section key={layer} className="mb-5">
                <div
                  className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.22em]"
                  style={{ color: LAYER_COLOR[layer] }}
                >
                  {LAYER_LABEL[layer]}
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {items.map((d) => (
                    <DoctrineCard key={d.technical} d={d} accent={LAYER_COLOR[layer]} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="border-t border-[var(--color-line)] px-6 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
          Press ESC or click X to dismiss · Doctrine maps to source files in
          <span className="text-[var(--color-text-dim)]"> sargvision-swarm/src/orchestrator/</span> ·
          <span className="text-[var(--color-text-dim)]"> sargvision-swarm/src/comms/</span> ·
          <span className="text-[var(--color-text-dim)]"> sargvision-swarm/src/core/</span>
        </footer>
      </div>
    </div>
  );
}

function DoctrineCard({ d, accent }: { d: Doctrine; accent: string }) {
  return (
    <article
      className="rounded-[2px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 p-3"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="font-mono text-[15px] tracking-[0.04em]" style={{ color: accent }}>
            {d.sanskrit} <span className="opacity-70">· {d.transliteration}</span>
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] text-[var(--color-text-dim)]">
            {d.meaning}
          </div>
        </div>
      </div>
      <div className="mt-2 font-mono text-[11.5px] text-[var(--color-text)]">
        ⟶ {d.technical}
      </div>
      <pre className="mt-1.5 overflow-x-auto rounded-[1px] border border-[var(--color-line)]/60 bg-[var(--color-canvas)]/60 px-2 py-1 font-mono text-[10.5px] tracking-tight text-[var(--color-status-ok)]">
        {d.math}
      </pre>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-[var(--color-text-vdim)]">
        <span>Source:</span>
        <span className="text-[var(--color-text-dim)]">{d.citation}</span>
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-[var(--color-text-vdim)]">
        Visible in: <span className="text-[var(--color-text-dim)]">{d.surfaced_in}</span>
      </div>
      <div className="mt-1.5 font-mono text-[10.5px] leading-snug text-[var(--color-text-dim)]">
        {d.notes}
      </div>
    </article>
  );
}
