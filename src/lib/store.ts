/** Zustand store — most recent swarm frame, UI selection, replay override. */

import { create } from "zustand";

import { useReplay } from "./replay";
import type { SwarmFrame } from "./types";

interface SwarmStore {
  connected: boolean;
  _liveFrame: SwarmFrame | null;
  // `frame` is injected by the hook wrapper below — it resolves to the replay-
  // scrubbed frame when scrubbing, else the live frame. Declared here so TS
  // selectors don't fail.
  frame: SwarmFrame | null;
  selectedDroneId: number | null;
  setConnected: (c: boolean) => void;
  setFrame: (f: SwarmFrame) => void;
  select: (id: number | null) => void;
  reset: () => void;
}

const _store = create<SwarmStore>((set) => ({
  connected: false,
  _liveFrame: null,
  // `frame` is computed on the fly by the wrapper below — never stored directly,
  // never mutated. Declaring it `null` here just satisfies the type.
  frame: null,
  selectedDroneId: null,
  setConnected: (connected) => set({ connected }),
  setFrame: (frame) => set({ _liveFrame: frame }),
  select: (selectedDroneId) => set({ selectedDroneId }),
  reset: () => set({ _liveFrame: null, selectedDroneId: null }),
}));

// Public hook that returns the scrubbed frame if replay is active, else live.
export const useSwarmStore: typeof _store = ((selector?: any, equality?: any) => {
  if (!selector) return _store();
  const wrapped = (state: SwarmStore) => {
    const replayState = useReplay.getState();
    const effectiveFrame = replayState.scrubbed ?? state._liveFrame;
    return selector({ ...state, frame: effectiveFrame });
  };
  return (_store as any)(wrapped, equality);
}) as typeof _store;

Object.assign(useSwarmStore, {
  getState: () => {
    const s = _store.getState();
    const replayState = useReplay.getState();
    const effectiveFrame = replayState.scrubbed ?? s._liveFrame;
    return { ...s, frame: effectiveFrame };
  },
  setState: _store.setState.bind(_store),
  subscribe: _store.subscribe.bind(_store),
  destroy: (_store as any).destroy?.bind(_store),
});
