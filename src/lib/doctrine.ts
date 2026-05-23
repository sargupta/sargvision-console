/** Chanakya Doctrine — every algorithm, its math, its Sanskrit doctrinal
 * name from Arthashastra-era statecraft, its modern citation, and where it
 * runs inside the engine.
 *
 * Sanskrit names are *meaningful* (not decorative): each refers to a
 * specific concept in Chanakya's Arthashastra or Vedic battle doctrine
 * that maps to the algorithm's behaviour.
 */

export interface Doctrine {
  /** Sanskrit / strategic-doctrine name (Devanagari + transliteration). */
  sanskrit: string;
  transliteration: string;
  meaning: string;          // what the Sanskrit word actually means
  technical: string;        // modern algorithm name
  layer: "command" | "shield" | "reflex" | "allocation" | "consensus" | "comms" | "nav" | "ew";
  math: string;             // single-line LaTeX-ish formula
  citation: string;         // arXiv ID or paper short cite
  citation_url?: string;
  surfaced_in: string;      // which UI panel shows this live
  notes: string;
}

export const DOCTRINES: Doctrine[] = [
  // ── Command doctrine — the overall ──
  {
    sanskrit: "चाणक्य नीति",
    transliteration: "Chanakya Niti",
    meaning: "Chanakya's statecraft — composition of force, intelligence, treasury, alliance",
    technical: "SARGVISION Composite Stack",
    layer: "command",
    math: "Π = Vyuha ∘ Shield ∘ Sabha ∘ Yajna ∘ Pratikriya",
    citation: "Arthashastra (4th c. BCE)",
    surfaced_in: "TopBar mission picker · this panel",
    notes:
      "Doctrine layer composing every running primitive into a coherent command picture. Not an algorithm — the integration is the IP.",
  },

  // ── SHIELD primitives ──
  {
    sanskrit: "दृष्टि",
    transliteration: "Drishti",
    meaning: "sight / perceptual coherence",
    technical: "Sheaf-Laplacian loyalty (SHIELD layer 1)",
    layer: "shield",
    math: "ℓᵢ = exp(-‖∇Δsensor‖² / 2σ²)  on the comm-graph cellular sheaf",
    citation: "Hansen & Ghrist, sheaf neural networks 2021 + own composition",
    surfaced_in: "ShieldPanel · loyal/suspect/hijacked counts",
    notes:
      "Each drone is a stalk over a cellular sheaf on the comm graph. Loyal drones agree on what they see; spoofed drones blow up the Dirichlet residual.",
  },
  {
    sanskrit: "विश्वास",
    transliteration: "Vishvas",
    meaning: "trust / earned reliance",
    technical: "Damped PageRank trust (SHIELD layer 2)",
    layer: "shield",
    math: "Tᵢ = (1-d) + d · Σⱼ ℓⱼ · Tⱼ / |Nⱼ|     (d = 0.85, 12 iters)",
    citation: "Brin & Page 1998 + loyalty-weighted variant in comms/trust.py",
    surfaced_in: "ShieldPanel · kill-thresh readout",
    notes:
      "Loyalty propagates over the comm graph via damped iteration. A loyal drone neighboring spoofed ones loses some trust by proximity. Below 0.25 → kill-switched.",
  },
  {
    sanskrit: "प्रज्ञा",
    transliteration: "Prajna",
    meaning: "discriminating wisdom — distinguishing real from apparent",
    technical: "Bayesian threat-class posterior (SHIELD layer 3)",
    layer: "shield",
    math: "P(class | obs) ∝ P(obs | class) · P(class)     over {decoy, kinetic, nuisance}",
    citation: "own composition; signature priors from Houthi-era decoy literature",
    surfaced_in: "ShieldPanel · DECOY/KINETIC/NUISANCE chips · hostile labels on map",
    notes:
      "Discriminates Luneburg-lens decoys from real kinetic threats by (RCS, RF emission, trajectory jerk). Posterior updated each observation.",
  },
  {
    sanskrit: "युक्ति",
    transliteration: "Yukti",
    meaning: "strategic apportionment — right means to right end",
    technical: "Trust-weighted engagement auction (SHIELD layer 4)",
    layer: "shield",
    math: "Eᵢⱼ = Tᵢ · 𝔼_θ[damage(θⱼ)] / dist(i,j)^α     bids fed into ED-CBBA",
    citation: "ED-CBBA arXiv 2509.06481 + SHIELD trust gating",
    surfaced_in: "CBBA panel · DECOYS SKIPPED counter in ShieldPanel",
    notes:
      "Bids weighted by bidder trust × expected damage. Decoys carry ~zero expected damage → no bids → munition saved. Hijacked drones (low trust) can't bid for anything.",
  },
  {
    sanskrit: "त्याग",
    transliteration: "Tyaga",
    meaning: "renunciation — withdrawal of a corrupted limb to save the body",
    technical: "Kill-switch on sub-threshold trust (SHIELD layer 5)",
    layer: "shield",
    math: "ifᵢ ∈ kill-switched ⟺ Tᵢ < 0.25     ⇒ votes ignored, bids zeroed",
    citation: "own; Byzantine threshold from PBFT literature",
    surfaced_in: "ShieldPanel · KILL-SW counter · INJECT HIJACK demo",
    notes:
      "Drones whose trust collapses are dropped from BFT votes + auctions. Limits an adversary's ability to amplify a single captured drone into a swarm-wide compromise.",
  },

  // ── Reflex layer ──
  {
    sanskrit: "व्यूह",
    transliteration: "Vyuha",
    meaning: "military formation (Padma, Chakra, Garuda used by Pandavas at Kurukshetra)",
    technical: "Reynolds Boids + Olfati-Saber Algorithm 3 + Vásárhelyi tuning",
    layer: "reflex",
    math: "v̇ᵢ = c₁·∇φα(rᵢⱼ) + c₂·(vⱼ - vᵢ) + γ-agent navigation",
    citation: "Reynolds 1987 + Olfati-Saber 2006 + Vásárhelyi 2018 (ELTE)",
    surfaced_in: "Drone positions on map · formation ring",
    notes:
      "Decentralized formation control. Olfati-Saber Algorithm 3 with γ-agent navigates the whole flock; Vásárhelyi 2018 parameters flew 30 outdoor drones at 8 m/s without central control.",
  },
  {
    sanskrit: "रक्षा परिधि",
    transliteration: "Raksha Paridhi",
    meaning: "defensive perimeter — Voronoi domain of each guardian",
    technical: "Buffered Voronoi Cells + GCBF+ control barrier",
    layer: "reflex",
    math: "vᵢ ∈ ∩ⱼ { v : ⟨nᵢⱼ, v⟩ ≤ rsafe }     +  MIT-REALM learned CBF",
    citation: "Zhou et al. RAL 2017 (BVC) + MIT-REALM gcbfplus (1024-agent validated)",
    surfaced_in: "Implicit — no collisions in the swarm",
    notes:
      "Each drone projects its desired velocity into its buffered Voronoi cell. Pairs with learned graph-neural CBF for harder guarantees. Sub-200ms loop on drone.",
  },

  // ── Task allocation ──
  {
    sanskrit: "यज्ञ",
    transliteration: "Yajna",
    meaning: "collective sacrifice — duty apportioned by the assembly",
    technical: "Event-Driven CBBA (ED-CBBA)",
    layer: "allocation",
    math: "winnerⱼ = argmaxᵢ { Tᵢ · 𝔼[damage(θⱼ)] / dᵢⱼ^α }     re-bid only on neighbor-change",
    citation: "arXiv 2509.06481 (52% radio reduction vs vanilla CBBA)",
    surfaced_in: "CBBA panel · live bid stream",
    notes:
      "Consensus-based bundle algorithm. Event-driven variant only re-bids when a neighbor's known winning bid changes — 52% less radio than vanilla CBBA.",
  },

  // ── Consensus ──
  {
    sanskrit: "सभा",
    transliteration: "Sabha",
    meaning: "assembly of seven — vedic council of elders",
    technical: "SwarmRaft K=7 BFT committee",
    layer: "consensus",
    math: "decision = ⌈²⁄₃ · K⌉ quorum     tolerates ⌊(K-1)/2⌋ = 3 byzantine",
    citation: "Ongaro & Ousterhout 2014 + Skoltech BFT for GNSS dropout (arXiv 2508.00622)",
    surfaced_in: "BFTAlert modal · top-center on engage/replan",
    notes:
      "Seven-member committee on mission state. Irreversible actions (engage / RTL / abort) require ⅔ quorum. Tolerates up to 3 byzantine (e.g. GNSS-spoofed) drones.",
  },

  // ── Comms ──
  {
    sanskrit: "संवाद",
    transliteration: "Samvaad",
    meaning: "structured dialogue — Bhagavad-Gita-style intent share",
    technical: "A2A (Agent2Agent) JSON-RPC 2.0 over HTTP+SSE",
    layer: "comms",
    math: "method ∈ { share.intent, negotiate.yield, claim.task, share.health }",
    citation: "Google / Linux Foundation, Apr 2025, Apache-2.0",
    surfaced_in: "Wire log · purple arcs on map · CommsLog protocol counter",
    notes:
      "Agent-to-agent protocol for capability discovery + intent share + yield negotiation + task claim. Complements MCP (which is agent-to-tool).",
  },

  // ── Nav (GNSS-denied) ──
  {
    sanskrit: "नक्षत्र-रहित मार्ग",
    transliteration: "Nakshatra-rahit Marg",
    meaning: "starless path — navigation when celestial reference is lost",
    technical: "CTU MRS heightmap-gradient nav (when GNSS toggle = denied)",
    layer: "nav",
    math: "ψ(x,y) = ∇h_terrain · vision-relative pose chain",
    citation: "arXiv 2510.01348 — 9 km GNSS-denied flight, CPU-only (CTU MRS, SPRIN-D 2025)",
    surfaced_in: "TopBar · GNSS-DENIED button + map fallback behavior",
    notes:
      "When Chinese spoofers blanket the LAC, GPS is meaningless. Drones fall back to terrain-relative navigation by gradient-matching against onboard heightmap.",
  },

  // ── Strike / formation resilience ──
  {
    sanskrit: "वज्र",
    transliteration: "Vajra",
    meaning: "Indra's thunderbolt — coordinated, decisive strike that doesn't shatter on impact",
    technical: "Voronoi-hysteresis + algebraic-connectivity + break-even strike doctrine",
    layer: "allocation",
    math: "λ₂(L_swarm) ≥ τ_frag ⟹ vajra_assign(targets, k* = break-even interceptors)",
    citation: "own — fragmentation alarm via Fiedler value of Laplacian; Voronoi hysteresis kills assignment thrash",
    surfaced_in: "(Phase J+) — fragmentation alarm in TopBar · engagement coordination quality",
    notes:
      "Vajra holds the swarm together under contact. Algebraic connectivity (Fiedler value of the comm-graph Laplacian) measures network resilience; below threshold = fragmentation alarm fires. Voronoi hysteresis prevents assignment thrashing when adjacent interceptors swap targets. Break-even computes the minimum interceptors needed for a credible strike against k hostiles.",
  },

  // ── EW ──
  {
    sanskrit: "रवि-निरोध",
    transliteration: "Ravi-nirodh",
    meaning: "obstruction of the sun (jamming) — and how to fight through it",
    technical: "Null-steering antenna array + PPO learned beamforming",
    layer: "ew",
    math: "wₖ = argmax SINR_k   subject to   pattern-null at jammer bearing",
    citation: "arXiv 2511.18086 — anti-jamming null-steering for UAV swarms",
    surfaced_in: "TopBar · JAM toggle + map comm-edge thinning",
    notes:
      "Adaptive beamforming nulls the jammer's bearing. Post-Sindoor (May 2025): 46/46 indigenous makers FAILED EW trials. This is where the differentiation lives.",
  },
];

export function doctrineForLayer(layer: Doctrine["layer"]): Doctrine[] {
  return DOCTRINES.filter((d) => d.layer === layer);
}
