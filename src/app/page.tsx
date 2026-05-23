"use client";

import { useEffect } from "react";

import { AssetRail } from "@/components/AssetRail";
import { BFTAlert } from "@/components/BFTAlert";
import { CBBAPanel } from "@/components/CBBAPanel";
import { CommsLog } from "@/components/CommsLog";
import { DegradedOpsBanner } from "@/components/DegradedOpsBanner";
import { DoctrinePanel } from "@/components/DoctrinePanel";
import { EngagementTimeline } from "@/components/EngagementTimeline";
import { Inspector } from "@/components/Inspector";
import { MigrationStats } from "@/components/MigrationStats";
import { MissionBriefing } from "@/components/MissionBriefing";
import { MissionObjectives } from "@/components/MissionObjectives";
import { PostMortem } from "@/components/PostMortem";
import { ReplayScrubber } from "@/components/ReplayScrubber";
import { ShieldPanel } from "@/components/ShieldPanel";
import { SwarmMap } from "@/components/SwarmMap";
import { TopBar } from "@/components/TopBar";
import { VajraPanel } from "@/components/VajraPanel";
import { connectSwarmWS } from "@/lib/ws";

const WS_URL = process.env.NEXT_PUBLIC_SWARM_WS_URL ?? "ws://127.0.0.1:8765/swarm";

export default function ConsolePage() {
  useEffect(() => {
    return connectSwarmWS(WS_URL);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[var(--color-canvas)]">
      <SwarmMap />
      <TopBar />
      <AssetRail />
      <Inspector />
      <CommsLog />
      <CBBAPanel />
      <ShieldPanel />
      <VajraPanel />
      <MigrationStats />
      <EngagementTimeline />
      <MissionObjectives />
      <BFTAlert />
      <DegradedOpsBanner />
      <ReplayScrubber />
      <MissionBriefing />
      <PostMortem />
      <DoctrinePanel />
    </main>
  );
}
