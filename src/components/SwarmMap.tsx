"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { ArcLayer, IconLayer, LineLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import { BASEMAPS, type BasemapId } from "@/lib/basemaps";
import { useSwarmStore } from "@/lib/store";
import { getDroneIcon, preloadDroneIcons } from "@/lib/symbols";
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
      sizeScale: 1,
      getSize: (d: (typeof iconData)[number]) => (d.selected ? 60 : 44),
      sizeMinPixels: 28,
      sizeMaxPixels: 72,
      updateTriggers: { getSize: [selectedId], getIcon: [iconData.length] },
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

    const layers = [edgeLayer, arcLayer, iconLayer];
    if (haloLayer) layers.splice(2, 0, haloLayer);
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
