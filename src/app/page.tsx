"use client";

import { useEffect } from "react";

import { AssetRail } from "@/components/AssetRail";
import { BFTAlert } from "@/components/BFTAlert";
import { CBBAPanel } from "@/components/CBBAPanel";
import { CommsLog } from "@/components/CommsLog";
import { DoctrinePanel } from "@/components/DoctrinePanel";
import { Inspector } from "@/components/Inspector";
import { MissionBriefing } from "@/components/MissionBriefing";
import { ShieldPanel } from "@/components/ShieldPanel";
import { SwarmMap } from "@/components/SwarmMap";
import { TopBar } from "@/components/TopBar";
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
      <BFTAlert />
      <MissionBriefing />
      <DoctrinePanel />
    </main>
  );
}
