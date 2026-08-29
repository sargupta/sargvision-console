"use client";

import { HelpCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * EXPLAIN mode — a plain-language guide for viewers who have never seen a
 * counter-UAS console before.
 *
 * Each topic answers one question a first-time viewer actually asks, in
 * ordinary English, and either draws its own visual key or spotlights the
 * region of the console it is talking about (any element carrying a matching
 * `data-explain` attribute). Topics with no spotlight target degrade to just
 * the card, so this never breaks if the layout moves.
 */

interface Topic {
  id: string;
  question: string;
  answer: string;
  /** `data-explain` value to ring on screen while this topic is open. */
  spotlight?: string;
  /** Small inline diagram drawn inside the card. */
  key?: "craft" | "links" | "chain";
}

const TOPICS: Topic[] = [
  {
    id: "overview",
    question: "What am I looking at?",
    answer:
      "A live command picture for a swarm of autonomous drones defending a site. The map is real terrain. Every icon is one aircraft. The panels around the edge are not decoration — each one shows a decision the swarm is making for itself, right now, with no operator in the loop.",
  },
  {
    id: "craft",
    question: "Which ones are the drones?",
    answer:
      "Every icon on the map is a single aircraft. Blue are ours, flying one of three jobs: scouts look, relays carry the radio link, strikers intercept. Red are the incoming threat. The green wedge is the command element — the aircraft currently coordinating the others.",
    key: "craft",
  },
  {
    id: "agents",
    question: "Where is the AI? Which part is the agent?",
    answer:
      "Each drone carries its own agent — there is no central brain. An agent senses, talks to its neighbours, and decides what to do next on board. Nobody on the ground assigns targets. When you see the swarm re-shuffle after a jam or a loss, that is the agents re-negotiating between themselves, in the air, in under a second.",
  },
  {
    id: "links",
    question: "How do the agents talk to each other?",
    answer:
      "The faint lines between aircraft are live radio links — that is the conversation. A line exists only while two drones are in range of each other, so the web constantly re-forms as they move. Turn on JAM and watch it thin out: range halves, links drop, and the swarm re-routes its messages through whoever can still hear whom.",
    key: "links",
  },
  {
    id: "chain",
    question: "What happens when a threat appears?",
    answer:
      "Five steps, and you can watch each one tick off. Detect: a scout sees it. Classify: the swarm decides together whether it is real or a decoy. Auction: drones bid, cheapest capable one wins. Authorise: a vote is taken before anything is fired. Intercept: the winner commits. Decoys are deliberately skipped to save munitions.",
    spotlight: "mission",
    key: "chain",
  },
  {
    id: "authority",
    question: "Who authorised firing?",
    answer:
      "The swarm votes. No single drone can commit a weapon — a supermajority has to agree first, so a captured or spoofed aircraft cannot start an engagement on its own. The panel shows the running vote and the trust score behind each member. A drone whose trust falls too far is cut out of the vote entirely.",
    spotlight: "doctrine",
  },
  {
    id: "chatter",
    question: "What is scrolling along the bottom?",
    answer:
      "The actual radio traffic between aircraft, as it happens — position reports, intent broadcasts, bids and votes. It is here so the swarm's reasoning is auditable rather than a black box: every decision above has a message trail underneath it.",
    spotlight: "wirelog",
  },
];

export function GuidePanel() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Topic | null>(null);

  // Ring the region of the console the open topic is describing.
  useEffect(() => {
    if (!active?.spotlight) return;
    const el = document.querySelector<HTMLElement>(`[data-explain="${active.spotlight}"]`);
    if (!el) return;
    el.classList.add("explain-spotlight");
    return () => el.classList.remove("explain-spotlight");
  }, [active]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute bottom-4 left-4 z-40 inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--color-friend)]/50 bg-[var(--color-canvas)]/92 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-friend)] backdrop-blur-sm hover:bg-[var(--color-friend)]/15"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Explain this screen
      </button>
    );
  }

  return (
    <aside className="pointer-events-auto absolute bottom-4 left-4 z-40 flex max-h-[78vh] w-[24rem] max-w-[calc(100vw-2rem)] flex-col rounded-[2px] border border-[var(--color-friend)]/40 bg-[var(--color-canvas)]/97 shadow-2xl backdrop-blur-sm">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-3 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-friend)]">
          <HelpCircle className="h-3.5 w-3.5" />
          Explain this screen
        </span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setActive(null);
          }}
          aria-label="Close guide"
          className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-2">
        {TOPICS.map((topic) => {
          const isOpen = active?.id === topic.id;
          return (
            <div key={topic.id} className="mb-1">
              <button
                type="button"
                onClick={() => setActive(isOpen ? null : topic)}
                className={cn(
                  "w-full rounded-[2px] px-2 py-1.5 text-left font-mono text-[11.5px] transition-colors",
                  isOpen
                    ? "bg-[var(--color-friend)]/12 text-[var(--color-friend)]"
                    : "text-[var(--color-text)] hover:bg-[var(--color-elevated)]/60",
                )}
              >
                {topic.question}
              </button>
              {isOpen && (
                <div className="px-2 pb-2 pt-1">
                  <p className="text-[11.5px] leading-relaxed text-[var(--color-text-dim)]">
                    {topic.answer}
                  </p>
                  {topic.key === "craft" && <CraftKey />}
                  {topic.key === "links" && <LinkKey />}
                  {topic.key === "chain" && <ChainKey />}
                  {topic.spotlight && (
                    <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--color-friend)]">
                      ↳ highlighted on screen
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ── Inline visual keys ──────────────────────────────────────────────────── */

function Row({ swatch, label }: { swatch: ReactNodeLike; label: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="flex h-4 w-8 flex-none items-center justify-center">{swatch}</span>
      <span className="text-[10.5px] text-[var(--color-text-dim)]">{label}</span>
    </div>
  );
}

type ReactNodeLike = React.ReactNode;

function CraftKey() {
  return (
    <div className="mt-2 rounded-[2px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 p-2">
      <Row swatch={<Dot color="var(--color-friend)" />} label="Ours — scout, relay or striker" />
      <Row swatch={<Dot color="var(--color-status-ok)" />} label="Command element — coordinating" />
      <Row swatch={<Dot color="var(--color-hostile)" />} label="Hostile contact — inbound" />
    </div>
  );
}

function LinkKey() {
  return (
    <div className="mt-2 rounded-[2px] border border-[var(--color-line)] bg-[var(--color-elevated)]/40 p-2">
      <Row
        swatch={
          <svg width="32" height="8" aria-hidden>
            <line x1="0" y1="4" x2="32" y2="4" stroke="#A78BFA" strokeWidth="1.5" />
          </svg>
        }
        label="Live radio link between two drones"
      />
      <Row
        swatch={
          <svg width="32" height="8" aria-hidden>
            <line
              x1="0"
              y1="4"
              x2="32"
              y2="4"
              stroke="var(--color-text-vdim)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        }
        label="Link lost — out of range or jammed"
      />
    </div>
  );
}

function ChainKey() {
  const steps = ["Detect", "Classify", "Auction", "Authorise", "Intercept"];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className="rounded-[1px] border border-[var(--color-friend)]/40 bg-[var(--color-friend)]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-friend)]">
            {s}
          </span>
          {i < steps.length - 1 && <span className="text-[var(--color-text-vdim)]">→</span>}
        </span>
      ))}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <svg width="12" height="12" aria-hidden>
      <circle cx="6" cy="6" r="4.5" fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}
