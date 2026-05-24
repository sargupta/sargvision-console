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
  // CHANAKYA per-drone planned geodesic — list of [lon, lat] waypoints
  geodesic?: [number, number][] | null;
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
  // SHESHNAG per-hostile panic level (SIR contagion 0..1)
  panic?: number;
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
  neutralized: number;   // friendly-intercepted (killed before impact)
  impacted?: number;     // HVT-struck self-destructions (leaked through)
}

/** Vajra (वज्र) — strike-coordination doctrine.
 * Voronoi hysteresis + algebraic connectivity (Fiedler λ₂) + break-even.
 */
export interface VajraSummary {
  lambda2: number;                 // Fiedler value of comm-graph Laplacian
  n_components: number;            // 1 = connected; >1 = fragmented
  fragmented: boolean;             // λ₂ < threshold → alarm fires
  fragmentation_threshold: number;
  jamming_factor: number;          // 0..1
  voronoi_owners: Record<number, number>;  // hostile_id → friendly_id
  handover_count: number;
  n_friendlies: number;
  n_hostiles_alive: number;
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

/** MAYA — Mean-field Adversarial Yielding Algorithm strategic posture (~30 s tick).
 *  Posture mix {defend / intercept / recon / decoy_emitter / retreat}.
 */
export type PostureAction = "defend" | "intercept" | "recon" | "decoy_emitter" | "retreat";

export interface MayaSummary {
  posture: Partial<Record<PostureAction, number>>;   // mixed strategy μ_F*
  top_posture: PostureAction;
  hostile_estimate: number[];          // μ̂_H aggregated SHIELD posteriors
  hostile_worst_case: number[];        // μ_H under W-DRO adversary
  classifier_entropy: number;          // H(θ|σ) — formless info-max signal
  value: number;                       // composite Bayes-Nash value
  n_solves: number;
  last_solved_t: number;
}

/** SHESHNAG — offensive psyops (Couzin-Krause + SIR + PQ-CCE + Kuramoto).
 *  Phase classification: POLARIZED / MILLING / SWARM.
 *  BFT-gated authorisation before any psyops broadcast fires.
 */
export type SwarmPhase = "POLARIZED" | "MILLING" | "SWARM";

export interface SheshnagBeacon {
  lon: number;
  lat: number;
}

export interface SheshnagSummary {
  armed: boolean;                     // console toggle
  authorized: boolean;                // BFT vote PASSED
  phase: SwarmPhase;
  polarization: number;               // P ∈ [0, 1]
  rotation: number;                   // R ∈ [0, 1] — milling-vortex signature
  mean_panic: number;                 // <I_j> across alive hostiles
  fraction_panicked: number;          // |{j: I_j > τ}| / N
  broadcasts_emitted: number;
  composite_value: number;
  beacons: SheshnagBeacon[];          // live broadcast targets this tick
}

/** CHANAKYA — Riemannian SEAD ingress (threat-field geodesic planner). */
export interface ChanakyaDefenseAsset {
  name: string;
  lon: number;
  lat: number;
  alt_m: number;
  engagement_radius_m: number;        // already geo-scaled
  active: boolean;
}

export interface ChanakyaSummary {
  enabled: boolean;
  n_drones_planned: number;
  total_action_cost: number;          // ∫ sqrt(g) ds along geodesic
  total_straight_cost: number;        // straight-line baseline action
  mean_savings_ratio: number;         // 1 - geodesic/straight
  n_replans: number;
  kills: number;                      // drones lost inside SAM radius
  arrivals: number;                   // drones reached target
  defense_assets: ChanakyaDefenseAsset[];
}

// ── Operation Trishul: border-strike HVT defence ──────────────────────
export type HVTStatus = "PROTECTED" | "UNDER_ATTACK" | "STRUCK";
export type HVTKind = "military" | "energy" | "command";

export interface HVT {
  id: string;
  name: string;
  kind: HVTKind;
  lon: number;
  lat: number;
  health: number;            // 0..1, 1 = pristine
  status: HVTStatus;
  hits_taken: number;
  impact_radius_m: number;   // already geo-scaled metres
}

export interface TrishulPhase {
  idx: number;
  of: number;
  name: string;              // PEACETIME | DETECTION | …
  caption: string;
  color: "friend" | "warn" | "hostile" | "ok";
  elapsed_s: number;
  duration_s: number;
  progress: number;          // 0..1
}

export interface TrishulAxisArrow {
  src: [number, number];     // [lon, lat]
  dst: [number, number];
  callsign: string;
  target_hvt: string;
}

export interface TrishulSummary {
  hvts: HVT[];
  loc_line: [number, number][]; // polyline of [lon, lat] points across the LoC
  axis_arrows: TrishulAxisArrow[];
  phase: TrishulPhase;
  all_protected: boolean;
  all_struck: boolean;
}

// ── VYUHA defence-strategy selection + per-HVT metrics ────────────────
// Strategy id is open-ended (string) so the UI can render whatever the
// backend lists in `available` without TS narrowing breaking the build.
export type VyuhaStrategy =
  // Trishul (multi-HVT)
  | "central" | "distributed" | "layered" | "cap"
  // Coverage (single zone)
  | "ring_uniform" | "azimuth_weighted" | "layered_intercept" | "flying_cap";

export interface VyuhaHVTMetrics {
  hvt_id: string;
  first_detect_t: number | null;
  first_hit_t: number | null;
  n_drones_allocated: number;
  n_intercepts_in_sector: number;
  n_kills_in_sector: number;
  mean_intercept_lag_s: number;
}

export interface VyuhaSummary {
  strategy: VyuhaStrategy;
  available: VyuhaStrategy[];        // which strategies the active scenario supports
  per_hvt: VyuhaHVTMetrics[];
  drone_sector: Record<string, string | null>; // drone_id → hvt_id
}

export interface SwarmFrame {
  t: number;
  step: number;
  scenario: string;
  drones: DroneState[];
  hostiles?: Hostile[];
  threat?: ThreatSummary | null;
  shield?: ShieldSummary | null;
  vajra?: VajraSummary | null;
  maya?: MayaSummary | null;
  sheshnag?: SheshnagSummary | null;
  chanakya?: ChanakyaSummary | null;
  trishul?: TrishulSummary | null;
  migration?: MigrationSummary | null;
  vyuha?: VyuhaSummary | null;
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

// ── Migration scenario (Governed Migration · DISC-14 PS-16) ────────────────
export interface MigrationZone {
  id: string;
  name: string;
  kind: "corridor" | "endpoint" | "staging";
  lon: number;
  lat: number;
  alt_m: number;
  radius_m: number;
  capacity: number;
  occupancy: number;
  color: string;
  closed?: boolean;
}

export interface MigrationHazard {
  id: string;
  kind?: "storm" | "wind_shear" | "thermal" | "glacier";
  name: string;
  lon: number;
  lat: number;
  alt_m: number;
  radius_m: number;
  severity: number;
  pulse_phase: number;
}

export interface MigrationTrail {
  id: number;
  path: Array<[number, number]>;
}

export interface MigrationClosureEvent {
  t: number;
  kind: "closed" | "reopen";
  name: string;
}

export interface MigrationSummary {
  zones: MigrationZone[];
  hazards: MigrationHazard[];
  trails?: MigrationTrail[];
  closure_events?: MigrationClosureEvent[];
  violations: number;
  completed_loops: number;
  collisions?: number;
  yields?: number;
  throughput_per_min?: Record<string, number>;
  assignments?: Record<string, string>;
}
