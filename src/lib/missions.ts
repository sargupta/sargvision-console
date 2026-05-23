/** Mission catalogue — top-bar picker.
 *
 * Each operational scenario maps to a backend LiveSession scenario name. The
 * console-side naming + ROE + ticket size come from the iDEX research synthesis.
 */

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
    id: "coverage",
    short: "CTR-SWARM",
    title: "IAF Counter-Swarm Intercept",
    service: "IAF",
    idex_ref: "ADITI 2.0 PS-11",
    ticket_inr_cr: 25,
    brief:
      "Hostile drones approach airfield from LoC at low altitude. Friendly swarm forms perimeter, ED-CBBA assigns targets, BFT authorizes engage.",
  },
  {
    id: "formation_v",
    short: "LAC-ISR",
    title: "Army LAC Persistent ISR",
    service: "ARMY",
    idex_ref: "DISC-14 PS-21",
    ticket_inr_cr: 11.5,
    brief:
      "Heterogeneous swarm (scout + relay + striker) maintains video + comms across 30 km mountain terrain at 14-18 k ft, GPS-denied.",
  },
  {
    id: "flock",
    short: "CARRIER-DEF",
    title: "Navy Carrier Defense Mesh",
    service: "NAVY",
    idex_ref: "DISC-14 PS-32",
    ticket_inr_cr: 1.5,
    brief:
      "Ship-launched mesh forms inner+outer ring around carrier group. Saturation strike intercept + sonobuoy scouts.",
  },
  {
    id: "migration",
    short: "MIGRATE-LAC",
    title: "Governed Migration · Leh → LAC",
    service: "ARMY",
    idex_ref: "DISC-14 PS-16",
    ticket_inr_cr: 11.5,
    brief:
      "100 drones flow Leh airbase → Nubra forward post via Khardung La / Zoji La / Tanglang La. Per-corridor capacity, glacier-storm avoidance, governance-style load balancing.",
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

export async function switchMission(id: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SWARM_HTTP_URL ?? "http://127.0.0.1:8765";
  await fetch(`${url}/scenario/${id}?n=24&seed=42`, { method: "POST" });
}
