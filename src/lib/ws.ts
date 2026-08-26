/** WebSocket client — auto-reconnect, msgpack frames, pushes into Zustand.
 *
 * Demo fallback: when no live backend is reachable within a grace window
 * (e.g. the static Cloudflare Pages deployment, which has no WS server), the
 * client loads a bundled recorded session from /demo/session.json and replays
 * it on a loop. This makes the public URL a self-contained demo with zero
 * backend. A live connection, if it ever opens, pre-empts the demo.
 */

import { Unpackr } from "msgpackr";

import { useEngagementLog } from "./engagement";
import { useIntentHistory } from "./history";
import { useReplay } from "./replay";
import { useSwarmStore } from "./store";
import type { SwarmFrame } from "./types";

const unpackr = new Unpackr({ useRecords: false });

/** Grace period (ms) before falling back to the bundled demo session. */
const DEMO_FALLBACK_MS = 3500;
/** Bundled recording for one scenario (static asset). One file per mission, so
 *  the picker can switch scenarios with no backend.
 *  Versioned to bust stale browser caches when the demos are re-recorded. */
const DEMO_VERSION = "4";
const demoUrl = (scenario: string) => `/demo/session.${scenario}.json?v=${DEMO_VERSION}`;
/** Scenario played when the page first falls back to demo mode. */
const DEFAULT_DEMO_SCENARIO = "border_strike";
/** Demo playback rate (ms per frame). Matches the 10 Hz recording. */
const DEMO_FRAME_MS = 100;

/** Wipe the derived client-side stores. Their contents belong to one scenario;
 *  carrying them across a mission switch would show the previous mission's
 *  engagement log and scrub buffer under the new mission's map. */
function resetDerivedStores(): void {
  useReplay.getState().clear();
  useIntentHistory.getState().reset();
  useEngagementLog.getState().reset();
}

/** Set by connectSwarmWS so the mission picker can drive demo playback.
 *  Null whenever a live backend is driving the console. */
let demoController: ((scenario: string) => Promise<boolean>) | null = null;

/** True when the console is replaying a bundled recording (no live backend). */
export function isDemoActive(): boolean {
  return demoController !== null;
}

/** Switch the replayed recording. Returns false if demo mode is not active or
 *  no recording exists for that scenario. */
export async function switchDemoScenario(scenario: string): Promise<boolean> {
  if (!demoController) return false;
  return demoController(scenario);
}

function ingestFrame(frame: SwarmFrame): void {
  useSwarmStore.getState().setFrame(frame);
  useReplay.getState().push(frame);
  const pushIntent = useIntentHistory.getState().push;
  for (const d of frame.drones) pushIntent(d.id, frame.t, d.intent);
  useEngagementLog.getState().ingest(frame);
}

export function connectSwarmWS(url: string): () => void {
  let ws: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let demoFallbackTimer: number | null = null;
  let demoPlaybackTimer: number | null = null;
  let shouldReconnect = true;
  let everConnected = false;
  let demoActive = false;
  let demoScenario: string | null = null;
  let retries = 0;

  /** 1.5 s while we still expect a backend; backs off to 30 s once the bundled
   *  demo is playing and there is nothing to wait for. */
  const nextRetryDelay = (): number => {
    if (!demoActive) return 1500;
    retries += 1;
    return Math.min(30_000, 1500 * 2 ** Math.min(retries, 5));
  };

  // ── Demo replay ──────────────────────────────────────────────────────────
  /** Load a scenario recording and start (or restart) the playback loop.
   *  Returns false and leaves any current playback untouched if the recording
   *  is missing, so a failed switch never blanks the map. */
  const playScenario = async (scenario: string): Promise<boolean> => {
    if (everConnected) return false;
    if (demoActive && demoScenario === scenario) return true; // already playing
    let frames: SwarmFrame[];
    try {
      const res = await fetch(demoUrl(scenario), { cache: "default" });
      if (!res.ok) {
        console.warn(`No bundled recording for scenario "${scenario}" (${res.status})`);
        return false;
      }
      const data = (await res.json()) as { frames: SwarmFrame[] };
      frames = data.frames ?? [];
    } catch (e) {
      console.warn("Demo session unavailable", e);
      return false;
    }
    if (!frames.length || everConnected) return false;

    // Only tear down the running loop once the new recording is in hand.
    if (demoPlaybackTimer) {
      window.clearTimeout(demoPlaybackTimer);
      demoPlaybackTimer = null;
    }
    resetDerivedStores();

    demoActive = true;
    demoScenario = scenario;
    useSwarmStore.getState().setDemo(true);
    useSwarmStore.getState().setConnected(true); // chrome shows "live"

    let i = 0;
    const tick = () => {
      if (everConnected) return; // live data pre-empted the demo
      ingestFrame(frames[i % frames.length]);
      i += 1;
      demoPlaybackTimer = window.setTimeout(tick, DEMO_FRAME_MS);
    };
    tick();
    return true;
  };

  const startDemo = async () => {
    if (demoActive || everConnected) return;
    const ok = await playScenario(DEFAULT_DEMO_SCENARIO);
    // Expose the switcher only once a recording actually plays, so the picker
    // can tell "demo mode" from "no data at all".
    if (ok) demoController = playScenario;
  };

  const stopDemo = () => {
    demoActive = false;
    demoScenario = null;
    demoController = null;
    if (demoPlaybackTimer) {
      window.clearTimeout(demoPlaybackTimer);
      demoPlaybackTimer = null;
    }
    useSwarmStore.getState().setDemo(false);
  };

  const armDemoFallback = () => {
    if (demoFallbackTimer || everConnected || demoActive) return;
    demoFallbackTimer = window.setTimeout(() => {
      demoFallbackTimer = null;
      if (!everConnected) void startDemo();
    }, DEMO_FALLBACK_MS);
  };

  // ── Live WebSocket ───────────────────────────────────────────────────────
  const open = () => {
    try {
      ws = new WebSocket(url);
    } catch {
      // Construction can throw on mixed-content (ws:// from https://) — go to demo.
      armDemoFallback();
      return;
    }
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      everConnected = true;
      retries = 0;
      stopDemo();
      if (demoFallbackTimer) {
        window.clearTimeout(demoFallbackTimer);
        demoFallbackTimer = null;
      }
      useSwarmStore.getState().setConnected(true);
    };

    ws.onmessage = (ev: MessageEvent) => {
      try {
        const buf = ev.data instanceof ArrayBuffer ? new Uint8Array(ev.data) : null;
        if (!buf) {
          ingestFrame(JSON.parse(ev.data) as SwarmFrame);
          return;
        }
        ingestFrame(unpackr.unpack(buf) as SwarmFrame);
      } catch (e) {
        console.error("WS unpack error", e);
      }
    };

    ws.onclose = () => {
      if (!demoActive) useSwarmStore.getState().setConnected(false);
      // If we never reached a live backend, fall back to the bundled demo.
      if (!everConnected) armDemoFallback();
      if (shouldReconnect) {
        // Once the demo is carrying the console, stop hammering a backend that
        // isn't there — back off instead, so a bridge started later is still
        // picked up but the console isn't spewing a failure every 1.5 s.
        reconnectTimer = window.setTimeout(open, nextRetryDelay());
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  };

  open();
  // Arm the fallback immediately in case the socket hangs without firing onclose.
  armDemoFallback();

  return () => {
    shouldReconnect = false;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    if (demoFallbackTimer) window.clearTimeout(demoFallbackTimer);
    stopDemo();
    ws?.close();
  };
}
