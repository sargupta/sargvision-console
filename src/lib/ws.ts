/** WebSocket client — auto-reconnect, msgpack frames, pushes into Zustand. */

import { Unpackr } from "msgpackr";

import { useEngagementLog } from "./engagement";
import { useIntentHistory } from "./history";
import { useReplay } from "./replay";
import { useSwarmStore } from "./store";
import type { SwarmFrame } from "./types";

const unpackr = new Unpackr({ useRecords: false });

export function connectSwarmWS(url: string): () => void {
  let ws: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let shouldReconnect = true;

  const open = () => {
    ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      useSwarmStore.getState().setConnected(true);
    };

    ws.onmessage = (ev: MessageEvent) => {
      try {
        const buf = ev.data instanceof ArrayBuffer ? new Uint8Array(ev.data) : null;
        if (!buf) {
          // Text frame fallback (JSON)
          const frame = JSON.parse(ev.data) as SwarmFrame;
          useSwarmStore.getState().setFrame(frame);
          useReplay.getState().push(frame);
          const pushIntent = useIntentHistory.getState().push;
          for (const d of frame.drones) pushIntent(d.id, frame.t, d.intent);
          useEngagementLog.getState().ingest(frame);
          return;
        }
        const frame = unpackr.unpack(buf) as SwarmFrame;
        useSwarmStore.getState().setFrame(frame);
        useReplay.getState().push(frame);
        const pushIntent = useIntentHistory.getState().push;
        for (const d of frame.drones) pushIntent(d.id, frame.t, d.intent);
        useEngagementLog.getState().ingest(frame);
      } catch (e) {
        console.error("WS unpack error", e);
      }
    };

    ws.onclose = () => {
      useSwarmStore.getState().setConnected(false);
      if (shouldReconnect) {
        reconnectTimer = window.setTimeout(open, 1500);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  };

  open();

  return () => {
    shouldReconnect = false;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    ws?.close();
  };
}
