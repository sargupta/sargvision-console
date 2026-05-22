"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { IconLayer, LineLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

import { useSwarmStore } from "@/lib/store";
import { getDroneIcon, preloadDroneIcons } from "@/lib/symbols";

const CARTO_DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Default scene center — Leh, Ladakh (LAC wedge). Backend anchor matches.
const DEFAULT_CENTER: [number, number] = [77.5770, 34.1526];
const DEFAULT_ZOOM = 17;

export function SwarmMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    preloadDroneIcons();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_DARK_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 35,
      bearing: -10,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("style.load", () => {
      // Tone down water / land base for defense feel.
      const layers = map.getStyle().layers;
      if (!layers) return;
      for (const layer of layers) {
        if (layer.type === "background") {
          map.setPaintProperty(layer.id, "background-color", "#0A0E14");
        }
      }
    });

    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [],
    });
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

  // Re-render layers when frame changes
  const frame = useSwarmStore((s) => s.frame);

  useEffect(() => {
    if (!overlayRef.current || !frame) return;

    // Build IconLayer data
    const iconData = frame.drones.map((d) => {
      const icon = getDroneIcon(d.affiliation, d.role);
      return {
        position: [d.lon, d.lat, d.alt_m] as [number, number, number],
        icon,
        drone: d,
      };
    });

    const iconLayer = new IconLayer({
      id: "drones",
      data: iconData,
      pickable: true,
      getIcon: (d: (typeof iconData)[number]) => ({
        url: d.icon.url,
        width: d.icon.width,
        height: d.icon.height,
        anchorY: d.icon.height / 2,
      }),
      getPosition: (d) => d.position,
      sizeScale: 1,
      getSize: 40,
      updateTriggers: { getIcon: [iconData.length] },
    });

    // Comm-range edges
    const edgeData = frame.edges.map((e) => {
      const a = frame.drones.find((d) => d.id === e.src);
      const b = frame.drones.find((d) => d.id === e.dst);
      if (!a || !b) return null;
      return {
        sourcePosition: [a.lon, a.lat, a.alt_m] as [number, number, number],
        targetPosition: [b.lon, b.lat, b.alt_m] as [number, number, number],
        strength: e.strength,
      };
    }).filter(Boolean) as Array<{
      sourcePosition: [number, number, number];
      targetPosition: [number, number, number];
      strength: number;
    }>;

    const edgeLayer = new LineLayer({
      id: "comm-edges",
      data: edgeData,
      getSourcePosition: (d) => d.sourcePosition,
      getTargetPosition: (d) => d.targetPosition,
      getColor: (d) => [16, 185, 129, Math.round(80 + 60 * d.strength)],
      getWidth: 1,
      widthUnits: "pixels",
    });

    overlayRef.current.setProps({ layers: [edgeLayer, iconLayer] });
  }, [frame]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
