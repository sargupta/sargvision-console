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

export interface SwarmFrame {
  t: number;
  step: number;
  scenario: string;
  drones: DroneState[];
  edges: CommEdge[];
  recent_messages: WireMessageEvent[];
  bft_events: BFTEvent[];
  cbba_events: CBBAEvent[];
  stats: {
    total_msgs: number;
    msgs_per_s: number;
    by_protocol: Record<string, number>;
  };
}
