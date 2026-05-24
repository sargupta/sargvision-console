# SARGVISION Swarm Console

[![CI](https://github.com/sargupta/sargvision-console/actions/workflows/ci.yml/badge.svg)](https://github.com/sargupta/sargvision-console/actions/workflows/ci.yml)
[![Deploy](https://github.com/sargupta/sargvision-console/actions/workflows/deploy.yml/badge.svg)](https://github.com/sargupta/sargvision-console/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/next.js-16-black)](https://nextjs.org)

> *Anduril Lattice-grade operator console for the SARGVISION Swarm command system.*
> Map, wire log, kill chain, BFT votes, replay scrubber, and post-mortem in one screen.

## What this is

`sargvision-console` is the operator UI for SARGVISION Swarm. It connects via WebSocket to the
Python bridge (`sargvision-swarm`) and renders the live drone swarm, hostile contacts, comm graph,
SHIELD/VAJRA/CHANAKYA telemetry, multi-protocol wire log, and Sanskrit-named doctrine panels.

Built for **Operation Trishul** — the 90-second scripted multi-axis attack scenario against three
named HVTs (Leh Airbase, Karu Power Station, DBO Forward Post) — and four other scenarios
(Counter-Swarm, Migration, LAC-ISR, Carrier Defense).

## Live demo

- **App:** https://sargvision-swarm.pages.dev
- **Backend bridge:** https://sargvision-swarm-bridge.fly.dev

## Quick start (local dev)

```bash
# Install (uses bun)
bun install

# Run dev server
bun run dev
# Open http://localhost:3000

# In a separate terminal, run the backend:
#   cd ../sargvision-swarm && python -m uvicorn sargvision_swarm.server.bridge:app
```

## Architecture

- **Next.js 16** + **React 19** + **Tailwind v4** + **Zustand**
- **MapLibre GL JS 5** — sovereign-acceptable open-source map (no Mapbox key, swaps to ISRO Bhuvan)
- **deck.gl 9** — IconLayer (drones, hostiles, HVTs), PathLayer (LoC, trails), ArcLayer (comm + engagement), TextLayer (callsigns, kill flashes)
- **WebSocket + msgpack** — 10 Hz frame stream from the FastAPI bridge

```
┌──────────────────────────────────────────────────────────────────┐
│ TopBar          [Mission picker · Threat counters · JAM/GNSS]    │
├─────────┬─────────────────────────────────────┬──────────────────┤
│ Asset   │              SwarmMap               │  RightDock       │
│ Rail    │  (3D terrain + drones + HVTs +      │  ├ MissionObj    │
│ (24×)   │   LoC + comm arcs + kill flashes)   │  ├ RightTabPanel │
│         │                                     │  └ BFTAlert      │
│         ├─────────────────────────────────────┤                  │
│         │           CommsLog (h-32)           │                  │
└─────────┴─────────────────────────────────────┴──────────────────┘
  Overlays: DegradedOpsBanner · TrishulPhaseBanner · ReplayScrubber
            MissionBriefing · PostMortem · DoctrinePanel
```

## Scenarios

| Mission              | Backend ID        | Service |
|----------------------|-------------------|---------|
| **Op Trishul**       | `border_strike`   | IAF     |
| CTR-SWARM            | `coverage`        | IAF     |
| MIGRATE-LAC          | `migration`       | Army    |
| LAC-ISR              | `formation_v`     | Army    |
| CARRIER-DEF          | `flock`           | Navy    |

## Development

```bash
bun run lint            # ESLint
bunx tsc --noEmit       # TypeScript check
bun run build           # Production build (static export)
```

## Deployment

Production deploys to **Cloudflare Pages** via `.github/workflows/deploy.yml` on push to `main`.
Static export build (`output: "export"`) — no edge runtime required, fully air-gappable.

## Companion repos

- [`sargvision-swarm`](https://github.com/sargupta/sargvision-swarm) — Python backend
- [`SARGVISION_Docs`](https://github.com/sargupta/SARGVISION_Docs) — Technical briefs, DPR (private)

## License

Apache License 2.0 — see [LICENSE](LICENSE).
Copyright 2026 SARGVISION Intelligence Private Limited.
