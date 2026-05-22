/** Zustand store — holds the most recent swarm frame + UI selection state. */

import { create } from "zustand";

import type { SwarmFrame } from "./types";

interface SwarmStore {
  connected: boolean;
  frame: SwarmFrame | null;
  selectedDroneId: number | null;
  setConnected: (c: boolean) => void;
  setFrame: (f: SwarmFrame) => void;
  select: (id: number | null) => void;
  reset: () => void;
}

export const useSwarmStore = create<SwarmStore>((set) => ({
  connected: false,
  frame: null,
  selectedDroneId: null,
  setConnected: (connected) => set({ connected }),
  setFrame: (frame) => set({ frame }),
  select: (selectedDroneId) => set({ selectedDroneId }),
  reset: () => set({ frame: null, selectedDroneId: null }),
}));
