"use client";

import { useEffect } from "react";

import { AssetRail } from "@/components/AssetRail";
import { BFTAlert } from "@/components/BFTAlert";
import { CommsLog } from "@/components/CommsLog";
import { DegradedOpsBanner } from "@/components/DegradedOpsBanner";
import { DoctrinePanel } from "@/components/DoctrinePanel";
import { MissionBriefing } from "@/components/MissionBriefing";
import { MissionObjectives } from "@/components/MissionObjectives";
import { PostMortem } from "@/components/PostMortem";
import { ReplayScrubber } from "@/components/ReplayScrubber";
import { RightDock } from "@/components/RightDock";
import { RightTabPanel } from "@/components/RightTabPanel";
import { SwarmMap } from "@/components/SwarmMap";
import { TopBar } from "@/components/TopBar";
import { TrishulPhaseBanner } from "@/components/TrishulPhaseBanner";
import { connectSwarmWS } from "@/lib/ws";

const WS_URL = process.env.NEXT_PUBLIC_SWARM_WS_URL ?? "ws://127.0.0.1:8765/swarm";

/**
 * Console page layout — Anduril Lattice-grade institutional grid.
 *
 *   ┌──────────────── TopBar (h-12) ─────────────────────┐
 *   │ AssetRail │           CLEAN MAP               │ RightDock │
 *   │   w-72    │   (drones, hostiles, layers)      │  w-26rem  │
 *   │           │                                   │  ─────────│
 *   │           ├──────── CommsLog (h-32) ──────────┤  · MissionObj
 *   └────────────────────────────────────────────────┘  · TabPanel
 *                                                       · BFTAlert
 *
 *   Floating overlays: DegradedOpsBanner (top-centre), TrishulPhaseBanner,
 *   ReplayScrubber (bottom-centre), DoctrinePanel + modals.
 */
export default function ConsolePage() {
  useEffect(() => {
    return connectSwarmWS(WS_URL);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[var(--color-canvas)]">
      {/* Base layer — map fills the whole viewport */}
      <SwarmMap />

      {/* Top edge */}
      <TopBar />

      {/* Left edge — asset rail */}
      <AssetRail />

      {/* Right edge — consolidated dock */}
      <RightDock
        mission={<MissionObjectives />}
        doctrine={<RightTabPanel />}
        alert={<BFTAlert />}
      />

      {/* Bottom edge — wire log strip (between left rail and right dock) */}
      <CommsLog />

      {/* Floating overlays — appear conditionally */}
      <DegradedOpsBanner />
      <TrishulPhaseBanner />
      <ReplayScrubber />
      <MissionBriefing />
      <PostMortem />
      <DoctrinePanel />
    </main>
  );
}
