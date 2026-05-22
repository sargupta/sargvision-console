# SARGVISION Swarm Console

**Indian-stack EW-survivable counter-swarm command console.**
Targeting iDEX **ADITI 2.0 PS-11** (₹25 cr — IAF Counter-Swarm), **DISC-14 PS-21** (Swarm-OS), **DISC-14 PS-16** (C2), **DISC-14 PS-32** (Navy EMP).

Next.js 16 · React 19 · Tailwind v4 · MapLibre + deck.gl · WebSocket + msgpack · Zustand · milsymbol (APP-6D NATO).

---

## What this is

A live mission console for the Python swarm engine at `~/Documents/GitHub/sargvision-swarm`. The FastAPI bridge in that repo (`swarm-bridge`) streams 10 Hz frames of swarm state — drone poses, comm-range adjacency, recent A2A/Zenoh/MAVLink/BFT/gRPC messages, BFT votes, ED-CBBA bids — into this React console, which renders them as a defense-grade tactical view.

The console looks and behaves like Anduril Lattice / Helsing Altra / Saronic Echelon — not like a generic AI dashboard.

## Quickstart

```bash
# 1. backend swarm engine + WebSocket bridge
cd ~/Documents/GitHub/sargvision-swarm
uv run swarm-bridge          # http://127.0.0.1:8765, ws /swarm

# 2. console (this repo)
cd ~/Documents/GitHub/sargvision-console
bun run dev                  # http://127.0.0.1:3000
```

Open `http://127.0.0.1:3000` and you see 24 ALFA-S Chanakya-class drones over **Leh, Ladakh** (LAC counter-swarm wedge).

## Mission queue (top-bar dropdown)

| ID | Mission | Service | iDEX ref | Ticket |
|---|---|---|---|---|
| `coverage` | IAF Counter-Swarm Intercept | IAF | ADITI 2.0 PS-11 | ₹25 cr |
| `formation_v` | Army LAC Persistent ISR | Army | DISC-14 PS-21 | ₹11.5 cr |
| `flock` | Navy Carrier Defense Mesh | Navy | DISC-14 PS-32 | ₹1.5 cr |
| `hover` | Hold Station | — | — | — |

Switching the mission live POSTs `/scenario/{id}` to the bridge — backend resets `LiveSession`, frontend re-renders fresh formation in seconds.

## Symbols & colors

- **NATO APP-6D Friend-UAV** (milsymbol SIDC `1003…`) per drone.
- Role tint: **cyan** worker · **green** scout · **amber** relay · **saffron** leader.
- A2A messages → **purple arcs** (fade 1.4 s TTL).
- Zenoh pose → cyan, MAVLink heartbeat → green, gRPC cognition → orange, BFT vote → red (thick).
- Saffron `#FF8A1F` panel chrome only — **never** on tactical layer (collides with NATO yellow = Unknown).

## Brooks-subsumption discipline

LLM emits **slow-loop intent**. Reflex layer (Boids / Olfati-Saber / BVC) closes the **fast control loop**. LLM never blocks an actuator. Standard rule for survivable autonomy.

## What's proprietary (the moat)

Algorithms are public commodity. The moat layers:

| Moat | Path | Timeline |
|---|---|---|
| **DGQA "Fit for Indian Military Use" cert** | replicate ideaForge SWITCH MINI path | M0–M12 |
| **PX4-fork autopilot on C-DAC Vega + Astra Microwave** | indigenous silicon, no Chinese parts | M0–M18 |
| **Indian-terrain sim + data flywheel** | NSIL/GalaxEye SAR + Survey of India + Bhuvan | M6–M18 |
| **Ex-IAF/IA/IN officers + 3-star MoD sponsor** | hire bench, procurement intel | M0–M6 |
| **iDEX → ATR Chitradurga → Make-II** | trial slots, serialized procurement | M0–M24 |

## Architecture

```
src/
  app/
    layout.tsx        Inter + JetBrains Mono fonts, dark CSS vars
    page.tsx          assembles SwarmMap + TopBar + AssetRail + Inspector
                      + CommsLog + CBBAPanel + BFTAlert
    globals.css       defense palette + Tailwind v4 @theme tokens
  components/
    SwarmMap          MapLibre + deck.gl IconLayer / ArcLayer / LineLayer
    BasemapSwitcher   SAT (ESRI) / DARK (CARTO) / BHUVAN (ISRO) toggle
    TopBar            brand + MissionPicker + live telemetry stats
    MissionPicker     scenario dropdown w/ iDEX ref + ticket
    AssetRail         left rail, 24-drone list + click-to-select
    Inspector         right rail, ALFA-S card + intent timeline +
                      lat/lon/alt + recent comms + ED-CBBA bids
    AlfaSilhouette    inline SVG of ALFA-S Chanakya delta-wing
    IntentTimeline    color-coded last-8 intent chips per drone
    CommsLog          bottom drawer w/ protocol counters + wire log
    CBBAPanel         live ED-CBBA bid stream during coverage
    BFTAlert          top-center modal when SwarmRaft vote fires
  lib/
    types.ts          SwarmFrame / DroneState / WireMessageEvent / …
    store.ts          Zustand: connected + frame + selectedDroneId
    history.ts        Zustand: intent ring buffer per drone
    ws.ts             WebSocket client w/ msgpackr + auto-reconnect
    symbols.ts        milsymbol → PNG canvas → deck.gl IconLayer URL
    basemaps.ts       MapLibre style specs (ESRI / CARTO / Bhuvan)
    missions.ts       mission catalogue + POST /scenario/{id}
```

## Stack rationale

- **MapLibre + deck.gl interleaved overlay** — 100 markers + arcs + lines without React re-render storms.
- **msgpack over WebSocket** — ~1–3 KB per frame at 10 Hz, half the bytes of JSON.
- **Zustand** with stable empty array refs — avoids React 19's `getServerSnapshot` infinite loop on selectors with defaults.
- **milsymbol → canvas PNG → deck.gl** — deck.gl can't decode SVG blob URLs; canvas PNG is the robust path.
- **Tailwind v4 `@theme` directive** — CSS-var-first design tokens, no JS config, smaller bundle.

## Visual language

Synthesised from defense-AI UI research (Anduril Lattice, Helsing Altra, Saronic Echelon, Palantir Gotham, Shield AI Hivemind):

- **Canvas `#07090C`**, surface `#0E1218`, elevated `#161B23`.
- Off-white text `#E6EBF2` — never pure white.
- 4-tier alert palette: nominal green / caution amber / warning orange / critical red.
- Brand accent: electric cyan `#00C2FF`.
- Bengal saffron `#FF8A1F` — panel chrome only.
- Inter + JetBrains Mono with `tabular-nums` always.
- 2-4 px border radius max — no `rounded-2xl`.
- Motion 120-200 ms ease-out only. No springs, no parallax, no glitch.
- Map is the page. Intent-not-control philosophy.

## See also

- Master plan: `~/Documents/AI_Workspace/drone_swarm_research/00_PIVOT_PLAN.md`
- iDEX problem statements: `~/Documents/AI_Workspace/drone_swarm_research/16_idex_problems.md`
- Indian operational scenarios: `~/Documents/AI_Workspace/drone_swarm_research/17_indian_ops.md`
- Defense AI moats: `~/Documents/AI_Workspace/drone_swarm_research/20_defense_moats.md`
- SOTA research papers: `~/Documents/AI_Workspace/drone_swarm_research/19_papers_sota.md`
- Backend swarm engine: `~/Documents/GitHub/sargvision-swarm`
