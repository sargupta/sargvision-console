/** Client-side replay buffer — keeps the last N seconds of swarm frames
 * so the operator can scrub backward through engagement events.
 *
 * Default capacity: 600 frames ≈ 60 s at 10 Hz. Enough for a single
 * counter-swarm engagement or a typical migration loop.
 */

import { create } from "zustand";

import type { SwarmFrame } from "./types";

interface ReplayStore {
  capacity: number;
  buffer: SwarmFrame[];
  /** When non-null, the console shows this frame instead of the live one. */
  scrubbed: SwarmFrame | null;
  /** Cursor index into buffer (latest = buffer.length - 1). */
  cursor: number | null;
  push: (frame: SwarmFrame) => void;
  scrubTo: (index: number | null) => void;
  clear: () => void;
}

const DEFAULT_CAPACITY = 600;

export const useReplay = create<ReplayStore>((set, get) => ({
  capacity: DEFAULT_CAPACITY,
  buffer: [],
  scrubbed: null,
  cursor: null,
  push: (frame) => {
    const s = get();
    const buf = [...s.buffer, frame];
    if (buf.length > s.capacity) buf.shift();
    set({ buffer: buf });
  },
  scrubTo: (index) => {
    const s = get();
    if (index == null) {
      set({ scrubbed: null, cursor: null });
      return;
    }
    const clamped = Math.max(0, Math.min(s.buffer.length - 1, index));
    set({ scrubbed: s.buffer[clamped] ?? null, cursor: clamped });
  },
  clear: () => set({ buffer: [], scrubbed: null, cursor: null }),
}));
