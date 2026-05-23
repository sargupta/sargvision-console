/** Engagement timeline — synthesised client-side by diffing SwarmFrame deltas.
 *
 * No backend change needed; we detect the kill-chain phase transitions on the
 * console by watching what changes between successive frames:
 *
 *   DETECT   — new hostile id appears in frame.hostiles[]
 *   CLASSIFY — hostile.threat_class transitions from null → known
 *   AUCTION  — hostile.assigned_to transitions from null → friendly id
 *   AUTHORIZE — BFT event with proposal starting "authorize_engage"
 *   VECTOR   — drone.intercept_target transitions from null → hostile id
 *   ENGAGE   — friendly position approaches within engagement_radius of hostile
 *   KIA      — kill_events entry appears
 *
 * The synthesised events live in a Zustand store. They drive the
 * EngagementTimeline + MissionObjectives panels.
 */

import { create } from "zustand";

import type { SwarmFrame, ThreatClass } from "./types";

export type Phase =
  | "detect"
  | "classify"
  | "auction"
  | "authorize"
  | "vector"
  | "kia"
  | "decoy_skipped";

export interface EngagementEvent {
  t: number;
  phase: Phase;
  hostile_id?: number;
  hostile_callsign?: string;
  threat_class?: ThreatClass;
  drone_id?: number;
  detail: string;
}

interface State {
  events: EngagementEvent[];
  seenHostileIds: Set<number>;
  classifiedHostileIds: Set<number>;
  auctionedHostileIds: Set<number>;
  vectoredPairs: Set<string>;      // "drone_id:hostile_id"
  killedHostileIds: Set<number>;
  authorizedAt: number;
  reset: () => void;
  ingest: (frame: SwarmFrame) => void;
}

const MAX_EVENTS = 300;

export const useEngagementLog = create<State>((set, get) => ({
  events: [],
  seenHostileIds: new Set(),
  classifiedHostileIds: new Set(),
  auctionedHostileIds: new Set(),
  vectoredPairs: new Set(),
  killedHostileIds: new Set(),
  authorizedAt: 0,
  reset: () =>
    set({
      events: [],
      seenHostileIds: new Set(),
      classifiedHostileIds: new Set(),
      auctionedHostileIds: new Set(),
      vectoredPairs: new Set(),
      killedHostileIds: new Set(),
      authorizedAt: 0,
    }),
  ingest: (frame) => {
    const s = get();
    const newEvents: EngagementEvent[] = [];
    const t = frame.t;

    // ── DETECT ──
    for (const h of frame.hostiles ?? []) {
      if (!s.seenHostileIds.has(h.id) && h.alive) {
        s.seenHostileIds.add(h.id);
        newEvents.push({
          t,
          phase: "detect",
          hostile_id: h.id,
          hostile_callsign: h.callsign,
          detail: `Contact ${h.callsign ?? `HST-${h.id}`} sighted at bearing ${h.bearing_deg.toFixed(0)}°`,
        });
      }
    }

    // ── CLASSIFY ──
    for (const h of frame.hostiles ?? []) {
      if (
        !s.classifiedHostileIds.has(h.id) &&
        h.threat_class &&
        h.threat_class !== "unknown" &&
        h.posterior
      ) {
        const pmax = Math.max(...h.posterior);
        if (pmax >= 0.55) {
          s.classifiedHostileIds.add(h.id);
          newEvents.push({
            t,
            phase: "classify",
            hostile_id: h.id,
            hostile_callsign: h.callsign,
            threat_class: h.threat_class,
            detail: `prajna classifies ${h.callsign ?? `HST-${h.id}`} as ${h.threat_class.toUpperCase()} (P=${pmax.toFixed(2)})`,
          });
          if (h.threat_class === "decoy") {
            newEvents.push({
              t: t + 0.01,
              phase: "decoy_skipped",
              hostile_id: h.id,
              hostile_callsign: h.callsign,
              detail: `yukti withholds bid on ${h.callsign} — decoy, E[damage]≈0, munition saved`,
            });
          }
        }
      }
    }

    // ── AUCTION ──
    for (const h of frame.hostiles ?? []) {
      if (
        !s.auctionedHostileIds.has(h.id) &&
        h.alive &&
        h.assigned_to != null
      ) {
        s.auctionedHostileIds.add(h.id);
        newEvents.push({
          t,
          phase: "auction",
          hostile_id: h.id,
          hostile_callsign: h.callsign,
          drone_id: h.assigned_to,
          detail: `yajna assigns DRN-${String(h.assigned_to).padStart(3, "0")} → intercept ${h.callsign ?? `HST-${h.id}`}`,
        });
      }
    }

    // ── AUTHORIZE (BFT engage votes) ──
    const lastBft = (frame.bft_events ?? []).at(-1);
    if (
      lastBft &&
      lastBft.t > s.authorizedAt &&
      lastBft.passed &&
      lastBft.proposal.toLowerCase().includes("engage")
    ) {
      s.authorizedAt = lastBft.t;
      newEvents.push({
        t: lastBft.t,
        phase: "authorize",
        detail: `sabha BFT ${lastBft.yes}/${lastBft.yes + lastBft.no} authorize engage doctrine — quorum hot`,
      });
    }

    // ── VECTOR (drone picks up intercept target) ──
    for (const d of frame.drones) {
      if (d.intercept_target != null) {
        const key = `${d.id}:${d.intercept_target}`;
        if (!s.vectoredPairs.has(key)) {
          s.vectoredPairs.add(key);
          const h = frame.hostiles?.find((x) => x.id === d.intercept_target);
          newEvents.push({
            t,
            phase: "vector",
            hostile_id: d.intercept_target,
            hostile_callsign: h?.callsign,
            drone_id: d.id,
            detail: `DRN-${String(d.id).padStart(3, "0")} vectors heading ${d.heading_deg.toFixed(0)}° → ${h?.callsign ?? `HST-${d.intercept_target}`}`,
          });
        }
      }
    }

    // ── KIA ──
    for (const k of frame.kill_events ?? []) {
      const hostId =
        frame.hostiles?.find((h) => h.callsign === k.callsign)?.id ?? -1;
      if (hostId === -1 || s.killedHostileIds.has(hostId)) continue;
      s.killedHostileIds.add(hostId);
      newEvents.push({
        t: k.t,
        phase: "kia",
        hostile_id: hostId,
        hostile_callsign: k.callsign,
        drone_id: k.killer_id,
        detail: `${k.callsign} NEUTRALIZED by DRN-${String(k.killer_id).padStart(3, "0")} · KIA`,
      });
    }

    if (newEvents.length === 0) return;

    // Reset trigger — if frame.step < previous max event step, new scenario started
    const lastEvent = s.events.at(-1);
    const isReset = lastEvent && t < lastEvent.t - 2;
    if (isReset) {
      set({
        events: newEvents,
        seenHostileIds: new Set(newEvents.filter((e) => e.hostile_id != null).map((e) => e.hostile_id!)),
        classifiedHostileIds: new Set(),
        auctionedHostileIds: new Set(),
        vectoredPairs: new Set(),
        killedHostileIds: new Set(),
        authorizedAt: 0,
      });
      return;
    }

    const merged = [...s.events, ...newEvents]
      .sort((a, b) => a.t - b.t)
      .slice(-MAX_EVENTS);
    set({ events: merged });
  },
}));
