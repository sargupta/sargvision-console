/** Wire types — must match the FastAPI msgpack payload. */

export type Affiliation = "friend" | "hostile" | "neutral" | "unknown";
export type Role = "worker" | "scout" | "relay" | "leader";
export type ShieldClass = "loyal" | "suspect" | "hijacked" | "kill_switched";
export type ThreatClass = "decoy" | "kinetic" | "nuisance" | "unknown";

export interface DroneState {
  id: number;
  lon: number;
  lat: number;
  alt_m: number;
  vel_ms: number;
  heading_deg: number;
  battery: number;
  healthy: boolean;
  role: Role;
  intent: string;
  affiliation: Affiliation;
  platform: string;
  task?: string;
  intercept_target?: number | null;
  // SHIELD per-drone state (loyalty + trust + class)
  loyalty?: number;            // 0..1, sheaf-Laplacian residual
  trust?: number;              // 0..1, PageRank-damped
  shield_class?: ShieldClass;
}

export interface CommEdge {
  src: number;
  dst: number;
  strength: number;
}

export interface WireMessageEvent {
  t: number;
  src: number;
  dst: number | null;
  protocol: "A2A" | "Zenoh" | "MAVLink" | "BFT" | "gRPC" | "MCP" | "DDS";
  topic: string;
  bytes: number;
  summary: string;
}

export interface BFTEvent {
  t: number;
  proposal: string;
  passed: boolean;
  yes: number;
  no: number;
  voters: number[];
  byzantine?: number[];
}

export interface CBBAEvent {
  t: number;
  task_id: string;
  bidder_id: number;
  bid_score: number;
}

export interface Hostile {
  id: number;
  callsign?: string;
  lon: number;
  lat: number;
  alt_m: number;
  alive: boolean;
  bearing_deg: number;
  intent: string;
  assigned_to?: number | null;
  // SHIELD per-hostile classification
  threat_class?: ThreatClass | null;
  posterior?: number[] | null;  // [P(decoy), P(kinetic), P(nuisance)]
}

export interface KillEvent {
  t: number;
  killer_id: number;
  callsign: string;
  lon: number;
  lat: number;
  alt_m: number;
}

export interface ThreatSummary {
  total: number;
  remaining: number;
  neutralized: number;
}

/** SHIELD aggregate state — drives the SHIELD panel + TopBar chip. */
export interface ShieldSummary {
  loyal: number;
  suspect: number;
  hijacked: number;
  kill_switched: number;
  decoys_skipped: number;     // decoys SHIELD refused to engage (saved munition)
  trust_kill_threshold: number;
  threat_mix: Partial<Record<ThreatClass, number>>;
  hijack_active: boolean;
}

export interface SwarmFrame {
  t: number;
  step: number;
  scenario: string;
  drones: DroneState[];
  hostiles?: Hostile[];
  threat?: ThreatSummary | null;
  shield?: ShieldSummary | null;
  flags?: { jamming: boolean; gnss_denied: boolean; hijack_active?: boolean };
  edges: CommEdge[];
  recent_messages: WireMessageEvent[];
  bft_events: BFTEvent[];
  cbba_events: CBBAEvent[];
  kill_events?: KillEvent[];
  stats: {
    total_msgs: number;
    msgs_per_s: number;
    by_protocol: Record<string, number>;
  };
}
