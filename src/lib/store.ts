/** Zustand store — holds the most recent swarm frame + connection status. */

import { create } from "zustand";

import type { SwarmFrame } from "./types";

interface SwarmStore {
  connected: boolean;
  frame: SwarmFrame | null;
  setConnected: (c: boolean) => void;
  setFrame: (f: SwarmFrame) => void;
  reset: () => void;
}

export const useSwarmStore = create<SwarmStore>((set) => ({
  connected: false,
  frame: null,
  setConnected: (connected) => set({ connected }),
  setFrame: (frame) => set({ frame }),
  reset: () => set({ frame: null }),
}));
