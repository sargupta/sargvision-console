/** Wire types — must match the FastAPI msgpack payload. */

export type Affiliation = "friend" | "hostile" | "neutral" | "unknown";
export type Role = "worker" | "scout" | "relay" | "leader";

export interface DroneState {
  id: number;
  lon: number;            // mapped from sim x → longitude
  lat: number;            // mapped from sim y → latitude
  alt_m: number;
  vel_ms: number;
  heading_deg: number;
  battery: number;
  healthy: boolean;
  role: Role;
  intent: string;
  affiliation: Affiliation;
  platform: string;       // e.g. "ALFA-S"
  task?: string;          // human-readable task ("INTERCEPT KAM-1005")
  intercept_target?: number | null;  // hostile.id this drone is chasing
}

export interface CommEdge {
  src: number;
  dst: number;
  strength: number;       // 0..1
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

export interface SwarmFrame {
  t: number;
  step: number;
  scenario: string;
  drones: DroneState[];
  hostiles?: Hostile[];
  threat?: ThreatSummary | null;
  flags?: { jamming: boolean; gnss_denied: boolean };
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
