"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { ArcLayer, IconLayer, LineLayer, TextLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import { BASEMAPS, type BasemapId } from "@/lib/basemaps";
import {
  getDroneIcon,
  getKillFlash,
  preloadDroneIcons,
} from "@/lib/drone-glyphs";
import { useSwarmStore } from "@/lib/store";
import { BasemapSwitcher } from "./BasemapSwitcher";

const DEFAULT_CENTER: [number, number] = [77.5770, 34.1526];
const DEFAULT_ZOOM = 13.2;

// Per-protocol arc color (R,G,B at full alpha).
const PROTOCOL_COLOR: Record<string, [number, number, number]> = {
  A2A: [167, 139, 250],     // purple
  Zenoh: [0, 194, 255],     // cyan
  MAVLink: [74, 230, 160],  // green
  BFT: [255, 77, 94],       // red
  gRPC: [255, 138, 31],     // orange
  MCP: [244, 114, 182],     // pink
  DDS: [0, 194, 255],
};

export function SwarmMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [basemap, setBasemap] = useState<BasemapId>("satellite");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    preloadDroneIcons();
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAPS.satellite.style,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 40,
      bearing: -12,
      attributionControl: { compact: true },
    });
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }),
      "top-right",
    );
    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    map.addControl(overlay);
    mapRef.current = map;
    overlayRef.current = overlay;
    return () => {
      overlay.finalize();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASEMAPS[basemap].style as never, { diff: false });
  }, [basemap]);

  const frame = useSwarmStore((s) => s.frame);
  const selectedId = useSwarmStore((s) => s.selectedDroneId);
  const select = useSwarmStore((s) => s.select);

  const droneIndex = useMemo(() => {
    if (!frame) return new Map<number, (typeof frame.drones)[number]>();
    return new Map(frame.drones.map((d) => [d.id, d]));
  }, [frame]);

  useEffect(() => {
    if (!overlayRef.current || !frame) return;
    const now = frame.t;

    // ── 1. Drone icons ─────────────────────────────────────────────
    const iconData = frame.drones.map((d) => {
      const icon = getDroneIcon(d.affiliation, d.role);
      return {
        position: [d.lon, d.lat, d.alt_m] as [number, number, number],
        icon,
        drone: d,
        selected: d.id === selectedId,
        heading_deg: d.heading_deg,
        role: d.role,
      };
    });
    const iconLayer = new IconLayer({
      id: "drones",
      data: iconData,
      pickable: true,
      onClick: ({ object }) => {
        if (object?.drone) select(object.drone.id);
      },
      getIcon: (d: (typeof iconData)[number]) => ({
        url: d.icon.url,
        width: d.icon.width,
        height: d.icon.height,
        anchorY: d.icon.height / 2,
        mask: false,
      }),
      getPosition: (d) => d.position,
      getAngle: (d: (typeof iconData)[number]) =>
        // canvas glyphs are drawn nose-up; deck.gl angle is CCW from east, so
        // -heading + 90 aligns: heading 0° (north) → 90° in deck angle.
        -d.heading_deg + 90,
      sizeScale: 1,
      getSize: (d: (typeof iconData)[number]) => {
        if (d.selected) return 72;
        if (d.role === "leader") return 60;
        if (d.role === "scout") return 52;
        if (d.role === "relay") return 56;
        return 48;
      },
      sizeMinPixels: 30,
      sizeMaxPixels: 88,
      updateTriggers: {
        getSize: [selectedId],
        getAngle: [frame.step],
        getIcon: [iconData.length],
      },
    });

    // Heading arrow per drone — short directional tick.
    const headingArrowData = frame.drones.map((d) => {
      const headingRad = (Math.PI / 180) * d.heading_deg;
      // ~12 m forward in sim → tiny lon/lat offset.
      const dx = Math.sin(headingRad) * 0.00007;
      const dy = Math.cos(headingRad) * 0.00007;
      return {
        source: [d.lon, d.lat, d.alt_m] as [number, number, number],
        target: [d.lon + dx, d.lat + dy, d.alt_m] as [number, number, number],
      };
    });
    const headingArrowLayer = new LineLayer({
      id: "drone-heading",
      data: headingArrowData,
      getSourcePosition: (d) => d.source,
      getTargetPosition: (d) => d.target,
      getColor: [230, 240, 250, 170],
      getWidth: 1.5,
      widthUnits: "pixels",
    });

    // ── Hostile contacts (red Shahed-style silhouettes) ────────────
    const hostileData = (frame.hostiles ?? [])
      .filter((h) => h.alive)
      .map((h) => {
        const icon = getDroneIcon("hostile", "worker", 64);
        // Bearing toward swarm centroid for the silhouette angle.
        let centroidLon = 0;
        let centroidLat = 0;
        for (const d of frame.drones) {
          centroidLon += d.lon;
          centroidLat += d.lat;
        }
        centroidLon /= Math.max(frame.drones.length, 1);
        centroidLat /= Math.max(frame.drones.length, 1);
        const dy = centroidLat - h.lat;
        const dx = centroidLon - h.lon;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return {
          position: [h.lon, h.lat, h.alt_m] as [number, number, number],
          icon,
          hostile: h,
          angle,
        };
      });
    const hostileLayer = new IconLayer({
      id: "hostiles",
      data: hostileData,
      pickable: false,
      getIcon: (d: (typeof hostileData)[number]) => ({
        url: d.icon.url,
        width: d.icon.width,
        height: d.icon.height,
        anchorY: d.icon.height / 2,
        mask: false,
      }),
      getPosition: (d) => d.position,
      getAngle: (d: (typeof hostileData)[number]) => d.angle,
      getSize: 56,
      sizeMinPixels: 30,
      sizeMaxPixels: 80,
      updateTriggers: { getAngle: [frame.step], getIcon: [hostileData.length] },
    });

    // Hostile callsign label.
    const hostileLabelLayer = new TextLayer({
      id: "hostile-labels",
      data: hostileData,
      getPosition: (d) => d.position,
      getText: (d) => d.hostile.callsign ?? `HST-${d.hostile.id}`,
      getColor: [255, 230, 230, 230],
      getSize: 11,
      getPixelOffset: [0, -34],
      fontFamily: "JetBrains Mono, ui-monospace, monospace",
      fontWeight: 600,
      background: true,
      getBackgroundColor: [40, 8, 12, 200],
      backgroundPadding: [3, 1, 3, 1],
      sizeUnits: "pixels",
    });

    // Threat arrows: faint red line from each living hostile to swarm centroid
    let centroid: [number, number, number] = [
      DEFAULT_CENTER[0],
      DEFAULT_CENTER[1],
      0,
    ];
    if (frame.drones.length > 0) {
      let lon = 0;
      let lat = 0;
      for (const d of frame.drones) {
        lon += d.lon;
        lat += d.lat;
      }
      centroid = [lon / frame.drones.length, lat / frame.drones.length, 0];
    }
    const threatLayer = new LineLayer({
      id: "threat-vectors",
      data: hostileData,
      getSourcePosition: (d: (typeof hostileData)[number]) => d.position,
      getTargetPosition: () => centroid,
      getColor: [255, 77, 94, 70],
      getWidth: 1,
      widthUnits: "pixels",
    });

    // ── Engagement arcs (interceptor → hostile, thick red) ──────────
    const hostileById = new Map((frame.hostiles ?? []).map((h) => [h.id, h]));
    const engageData = frame.drones
      .filter((d) => d.intercept_target != null)
      .map((d) => {
        const h = hostileById.get(d.intercept_target as number);
        if (!h || !h.alive) return null;
        return {
          source: [d.lon, d.lat, d.alt_m] as [number, number, number],
          target: [h.lon, h.lat, h.alt_m] as [number, number, number],
          callsign: h.callsign ?? `HST-${h.id}`,
          drone_id: d.id,
        };
      })
      .filter(Boolean) as Array<{
      source: [number, number, number];
      target: [number, number, number];
      callsign: string;
      drone_id: number;
    }>;
    const engagementArcLayer = new ArcLayer({
      id: "engagement-arcs",
      data: engageData,
      getSourcePosition: (d) => d.source,
      getTargetPosition: (d) => d.target,
      getSourceColor: [255, 200, 60, 220],
      getTargetColor: [255, 77, 94, 240],
      getWidth: 3.5,
      widthUnits: "pixels",
      greatCircle: false,
      getHeight: 1.0,
    });

    // ── Kill flash sprites (orange burst, fade by age) ───────────────
    const KILL_TTL = 1.4;
    const killData = (frame.kill_events ?? [])
      .filter((k) => frame.t - k.t <= KILL_TTL)
      .map((k) => {
        const age = Math.max(0, frame.t - k.t);
        const ageFrac = Math.min(1, age / KILL_TTL);
        return {
          position: [k.lon, k.lat, k.alt_m] as [number, number, number],
          ageFrac,
          alpha: 1 - ageFrac,
          callsign: k.callsign,
          killer_id: k.killer_id,
        };
      });
    const killFlashIcon = getKillFlash();
    const killLayer = new IconLayer({
      id: "kill-flash",
      data: killData,
      getIcon: () => ({
        url: killFlashIcon.url,
        width: killFlashIcon.width,
        height: killFlashIcon.height,
        anchorY: killFlashIcon.height / 2,
        mask: false,
      }),
      getPosition: (d) => d.position,
      getSize: (d: (typeof killData)[number]) => 80 + d.ageFrac * 40,
      getColor: (d: (typeof killData)[number]) => [
        255,
        255,
        255,
        Math.round(255 * d.alpha),
      ],
      sizeUnits: "pixels",
      updateTriggers: { getSize: [frame.t], getColor: [frame.t] },
    });
    const killLabelLayer = new TextLayer({
      id: "kill-labels",
      data: killData,
      getPosition: (d) => d.position,
      getText: (d) => `KIA · ${d.callsign}`,
      getColor: (d) => [255, 240, 140, Math.round(255 * d.alpha)],
      getSize: 12,
      getPixelOffset: [0, -42],
      fontFamily: "JetBrains Mono, ui-monospace, monospace",
      fontWeight: 700,
      background: true,
      getBackgroundColor: (d) => [40, 8, 12, Math.round(220 * d.alpha)],
      backgroundPadding: [4, 1, 4, 1],
      sizeUnits: "pixels",
    });

    // ── Per-drone task labels (small, under each drone) ──────────────
    const taskLabelLayer = new TextLayer({
      id: "drone-tasks",
      data: frame.drones,
      getPosition: (d) => [d.lon, d.lat, d.alt_m],
      getText: (d) => d.task ?? "",
      getColor: (d) => {
        if (d.task?.startsWith("INTERCEPT")) return [255, 200, 60, 220];
        if (d.task === "COMMAND ELEMENT") return [255, 138, 31, 200];
        if (d.task === "PATROL PERIMETER") return [74, 230, 160, 200];
        if (d.task === "RELAY LINK") return [255, 200, 61, 200];
        return [148, 163, 184, 180];
      },
      getSize: 9.5,
      getPixelOffset: [0, 30],
      fontFamily: "JetBrains Mono, ui-monospace, monospace",
      sizeUnits: "pixels",
    });

    // ── 2. Selection halo (background highlight ring) ──────────────
    const selectedDrone = selectedId != null ? droneIndex.get(selectedId) : null;
    const haloLayer = selectedDrone
      ? new IconLayer({
          id: "selection-halo",
          data: [selectedDrone],
          getIcon: () => ({
            url:
              "data:image/svg+xml;utf8," +
              encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='44' fill='none' stroke='%2300C2FF' stroke-width='3'/><circle cx='50' cy='50' r='28' fill='none' stroke='%2300C2FF' stroke-width='1.5' stroke-dasharray='4 3'/></svg>`,
              ),
            width: 100,
            height: 100,
            anchorY: 50,
          }),
          getPosition: (d) => [d.lon, d.lat, d.alt_m],
          sizeScale: 1,
          getSize: 96,
        })
      : null;

    // ── 3. Comm-range edges (subtle background) ───────────────────
    const edgeData = frame.edges
      .map((e) => {
        const a = droneIndex.get(e.src);
        const b = droneIndex.get(e.dst);
        if (!a || !b) return null;
        return {
          sourcePosition: [a.lon, a.lat, a.alt_m] as [number, number, number],
          targetPosition: [b.lon, b.lat, b.alt_m] as [number, number, number],
          strength: e.strength,
        };
      })
      .filter(Boolean) as Array<{
      sourcePosition: [number, number, number];
      targetPosition: [number, number, number];
      strength: number;
    }>;
    const edgeLayer = new LineLayer({
      id: "comm-edges",
      data: edgeData,
      getSourcePosition: (d) => d.sourcePosition,
      getTargetPosition: (d) => d.targetPosition,
      getColor: (d) => [0, 194, 255, Math.round(20 + 40 * d.strength)],
      getWidth: 1,
      widthUnits: "pixels",
    });

    // ── 4. Live A2A / BFT / gRPC message arcs (fade by age) ───────
    // Only animate point-to-point messages (skip broadcasts and drone heartbeats).
    const ARC_TTL_S = 1.4;
    const arcData = frame.recent_messages
      .filter((m) => m.dst != null && m.src !== m.dst)
      .filter((m) => now - m.t <= ARC_TTL_S)
      .map((m) => {
        const a = droneIndex.get(m.src);
        const b = droneIndex.get(m.dst as number);
        if (!a || !b) return null;
        const ageFrac = Math.min(1, (now - m.t) / ARC_TTL_S);
        const alpha = Math.round(255 * (1 - ageFrac));
        const c = PROTOCOL_COLOR[m.protocol] ?? [136, 136, 136];
        return {
          source: [a.lon, a.lat, a.alt_m] as [number, number, number],
          target: [b.lon, b.lat, b.alt_m] as [number, number, number],
          color: [...c, alpha] as [number, number, number, number],
          width: m.protocol === "BFT" ? 3 : 1.5,
        };
      })
      .filter(Boolean) as Array<{
      source: [number, number, number];
      target: [number, number, number];
      color: [number, number, number, number];
      width: number;
    }>;
    const arcLayer = new ArcLayer({
      id: "comm-arcs",
      data: arcData,
      getSourcePosition: (d) => d.source,
      getTargetPosition: (d) => d.target,
      getSourceColor: (d) => d.color,
      getTargetColor: (d) => d.color,
      getWidth: (d) => d.width,
      widthUnits: "pixels",
      greatCircle: false,
      getHeight: 0.6,
    });

    const layers = [
      edgeLayer,
      threatLayer,
      arcLayer,
      engagementArcLayer,
      hostileLayer,
      hostileLabelLayer,
      headingArrowLayer,
      iconLayer,
      taskLabelLayer,
      killLayer,
      killLabelLayer,
    ];
    if (haloLayer) layers.splice(7, 0, haloLayer);
    overlayRef.current.setProps({ layers });
  }, [frame, selectedId, select, droneIndex]);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ width: "100vw", height: "100vh" }}
      />
      <BasemapSwitcher value={basemap} onChange={setBasemap} />
    </>
  );
}
