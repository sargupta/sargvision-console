/** Mission catalogue — top-bar picker.
 *
 * Each operational scenario maps to a backend LiveSession scenario name. The
 * console-side naming + ROE + ticket size come from the iDEX research synthesis.
 */

import { isDemoActive, switchDemoScenario } from "./ws";

export interface Mission {
  id: string;                  // backend scenario name (sent to POST /scenario/{id})
  short: string;
  title: string;
  service: "IAF" | "ARMY" | "NAVY";
  idex_ref: string;
  ticket_inr_cr: number;
  brief: string;
}

export const MISSIONS: Mission[] = [
  {
    id: "border_strike",
    short: "C-UAS DEFENCE",
    title: "Critical-Infrastructure C-UAS Defence",
    service: "IAF",
    idex_ref: "C-UAS DEMO",
    ticket_inr_cr: 25,
    brief:
      "Hostile drone wave targets three critical-infrastructure assets (substation + data centre + water plant). Coordination kill chain: detection → classification → auction → ROE gate → interceptor. Assets PROTECTED.",
  },
  {
    id: "coverage",
    short: "CTR-SWARM",
    title: "Counter-Swarm Intercept",
    service: "IAF",
    idex_ref: "C-UAS DEMO",
    ticket_inr_cr: 25,
    brief:
      "Hostile drones approach a defended site at low altitude. Defender swarm forms a perimeter, ED-CBBA assigns targets, BFT consensus authorises engagement.",
  },
  {
    id: "formation_v",
    short: "PERSISTENT-ISR",
    title: "Persistent ISR Patrol",
    service: "ARMY",
    idex_ref: "C-UAS DEMO",
    ticket_inr_cr: 11.5,
    brief:
      "Heterogeneous swarm (scout + relay + striker) maintains video + comms across 30 km of terrain at altitude, GNSS-denied.",
  },
  {
    id: "flock",
    short: "PERIMETER-DEF",
    title: "Maritime Perimeter Defence Mesh",
    service: "NAVY",
    idex_ref: "C-UAS DEMO",
    ticket_inr_cr: 1.5,
    brief:
      "Vessel-launched mesh forms inner + outer rings around a high-value platform. Saturation intercept + sonobuoy scouts.",
  },
  {
    id: "migration",
    short: "MIGRATE",
    title: "Governed Corridor Migration",
    service: "ARMY",
    idex_ref: "C-UAS DEMO",
    ticket_inr_cr: 11.5,
    brief:
      "100 drones flow from a rear node to a forward node via three corridors. Per-corridor capacity, storm avoidance, governance-style load balancing.",
  },
  {
    id: "hover",
    short: "HOLD",
    title: "Hold Station",
    service: "IAF",
    idex_ref: "—",
    ticket_inr_cr: 0,
    brief: "All drones hold position at orbit altitude. Used for between-mission idle.",
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

/** How a mission switch was actually served. */
export type SwitchResult = "live" | "demo" | "unavailable";

/**
 * Switch the running scenario.
 *
 * Prefers the live backend. When there is none — the static Cloudflare Pages
 * deployment, or a laptop with the bridge not running — falls back to the
 * bundled recording for that mission. Never throws: the caller needs to know
 * which of the three things happened so the UI can say so.
 */
export async function switchMission(id: string): Promise<SwitchResult> {
  // Already replaying recordings: don't fire a POST that is guaranteed to fail
  // (and, on an https page, to be blocked as mixed content).
  if (isDemoActive()) {
    return (await switchDemoScenario(id)) ? "demo" : "unavailable";
  }

  const url = process.env.NEXT_PUBLIC_SWARM_HTTP_URL ?? "http://127.0.0.1:8765";
  try {
    const res = await fetch(`${url}/scenario/${id}?n=24&seed=42`, { method: "POST" });
    if (res.ok) return "live";
    console.warn(`Backend refused scenario "${id}" (${res.status})`);
  } catch {
    // No backend reachable (offline static deploy, or blocked as mixed content
    // when the page is https and the bridge is http). Fall through to the demo.
  }
  return (await switchDemoScenario(id)) ? "demo" : "unavailable";
}
