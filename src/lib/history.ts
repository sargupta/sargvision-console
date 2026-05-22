/** Client-side intent history — keeps last N intents per drone.
 *
 * Populated by the WS layer on every frame; consumed by Inspector and the
 * IntentTimeline component.
 */

import { create } from "zustand";

interface IntentTick {
  t: number;
  intent: string;
}

interface HistoryStore {
  byDrone: Map<number, IntentTick[]>;
  push: (id: number, t: number, intent: string) => void;
  reset: () => void;
}

const MAX_PER_DRONE = 8;

export const useIntentHistory = create<HistoryStore>((set, get) => ({
  byDrone: new Map(),
  push: (id, t, intent) => {
    const map = new Map(get().byDrone);
    const list = map.get(id) ?? [];
    if (list.length && list[list.length - 1].intent === intent) return; // no change
    const next = [...list, { t, intent }];
    if (next.length > MAX_PER_DRONE) next.shift();
    map.set(id, next);
    set({ byDrone: map });
  },
  reset: () => set({ byDrone: new Map() }),
}));

export const EMPTY_HISTORY: IntentTick[] = [];
