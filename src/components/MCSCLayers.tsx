"use client";

/** Deck.gl layer builders for MAYA / CHANAKYA / SHESHNAG telemetry.
 *
 * Renders, conditional on the corresponding summary being present in the frame:
 *
 *   CHANAKYA — per-drone planned geodesic (faint orange PathLayer)
 *            — defense-asset markers + engagement-radius polygons (red)
 *   SHESHNAG — spoofed-beacon flash dots (yellow with white ring)
 *   (panic-level colour encoding on hostiles is applied directly in SwarmMap.tsx)
 *
 * Returned as a flat list of deck.gl layers the SwarmMap composes.
 */

import { IconLayer, PathLayer, PolygonLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

import type {
  ChanakyaDefenseAsset,
  ChanakyaSummary,
  DroneState,
  Hostile,
  SheshnagSummary,
} from "@/lib/types";

// Generate a circular polygon (in degrees lat/lon) of N vertices.
function circlePolygon(
  lon: number,
  lat: number,
  radius_m: number,
  vertices = 48,
): [number, number][] {
  const dLat = radius_m / 111_320;
  const dLon = radius_m / (111_320 * Math.cos((lat * Math.PI) / 180));
  const pts: [number, number][] = [];
  for (let i = 0; i < vertices; i++) {
    const ang = (i / vertices) * 2 * Math.PI;
    pts.push([lon + Math.cos(ang) * dLon, lat + Math.sin(ang) * dLat]);
  }
  return pts;
}

// CHANAKYA — geodesic paths per drone (only when present).
function chanakyaGeodesicLayer(drones: DroneState[]): Layer | null {
  const paths = drones
    .filter((d) => Array.isArray(d.geodesic) && (d.geodesic?.length ?? 0) >= 2)
    .map((d) => ({
      path: d.geodesic as [number, number][],
      id: d.id,
    }));
  if (paths.length === 0) return null;
  return new PathLayer({
    id: "chanakya-geodesics",
    data: paths,
    pickable: false,
    widthUnits: "pixels",
    getWidth: 2,
    getColor: [255, 165, 0, 140],   // soft orange
    getPath: (d) => d.path,
  });
}

// CHANAKYA — engagement-radius polygons + radar icons for defense assets.
function chanakyaDefenseLayers(chanakya: ChanakyaSummary | null | undefined): Layer[] {
  if (!chanakya || !chanakya.defense_assets || chanakya.defense_assets.length === 0) {
    return [];
  }
  const assets = chanakya.defense_assets;
  const ringData = assets
    .filter((a) => a.active)
    .map((a: ChanakyaDefenseAsset) => ({
      polygon: circlePolygon(a.lon, a.lat, a.engagement_radius_m, 64),
      name: a.name,
    }));
  const ringLayer = new PolygonLayer({
    id: "chanakya-engagement-rings",
    data: ringData,
    stroked: true,
    filled: true,
    getPolygon: (d) => d.polygon,
    getFillColor: [255, 64, 64, 28],
    getLineColor: [255, 64, 64, 180],
    getLineWidth: 2,
    lineWidthUnits: "pixels",
  });

  // Centre markers — small filled discs for each active radar/SAM.
  const dotData = assets
    .filter((a) => a.active)
    .map((a) => ({
      polygon: circlePolygon(a.lon, a.lat, 60, 24),
      name: a.name,
    }));
  const dotLayer = new PolygonLayer({
    id: "chanakya-asset-dots",
    data: dotData,
    stroked: true,
    filled: true,
    getPolygon: (d) => d.polygon,
    getFillColor: [255, 32, 32, 220],
    getLineColor: [255, 255, 255, 220],
    getLineWidth: 1.5,
    lineWidthUnits: "pixels",
  });

  return [ringLayer, dotLayer];
}

// SHESHNAG — broadcast beacon flashes.
function sheshnagBeaconLayer(sheshnag: SheshnagSummary | null | undefined): Layer | null {
  if (!sheshnag || !sheshnag.beacons || sheshnag.beacons.length === 0) return null;
  // Use a simple polygon "pulse" so we don't need an icon asset.
  const data = sheshnag.beacons.map((b) => ({
    polygon: circlePolygon(b.lon, b.lat, 300, 32),
  }));
  return new PolygonLayer({
    id: "sheshnag-beacons",
    data,
    stroked: true,
    filled: true,
    getPolygon: (d) => d.polygon,
    getFillColor: [253, 224, 71, 60],     // amber-300 @ 24% alpha
    getLineColor: [253, 224, 71, 220],
    getLineWidth: 1.8,
    lineWidthUnits: "pixels",
  });
}

// SHESHNAG — per-hostile panic underlay (red glow under panicked hostiles).
// Behaves as a circular halo whose alpha scales with panic level.
function sheshnagPanicGlowLayer(hostiles: Hostile[] | undefined): Layer | null {
  if (!hostiles || hostiles.length === 0) return null;
  const data = hostiles
    .filter((h) => h.alive && (h.panic ?? 0) > 0.15)
    .map((h) => {
      const p = h.panic ?? 0;
      // panic 0.15 → alpha 30 ; panic 1.0 → alpha 180
      const alpha = Math.round(30 + (180 - 30) * Math.min(1.0, Math.max(0.0, (p - 0.15) / 0.85)));
      return {
        polygon: circlePolygon(h.lon, h.lat, 220 + 140 * p, 32),
        alpha,
      };
    });
  if (data.length === 0) return null;
  return new PolygonLayer({
    id: "sheshnag-panic-glow",
    data,
    stroked: false,
    filled: true,
    getPolygon: (d) => d.polygon,
    getFillColor: (d: { alpha: number }) => [255, 80, 80, d.alpha],
  });
}

export function mcscLayers(
  drones: DroneState[],
  hostiles: Hostile[] | undefined,
  chanakya: ChanakyaSummary | null | undefined,
  sheshnag: SheshnagSummary | null | undefined,
): Layer[] {
  const layers: Layer[] = [];
  // Order: defense rings (back), panic glow (back, behind hostile icons),
  // geodesics (mid), beacons (front).
  layers.push(...chanakyaDefenseLayers(chanakya));
  const panicGlow = sheshnagPanicGlowLayer(hostiles);
  if (panicGlow) layers.push(panicGlow);
  const geo = chanakyaGeodesicLayer(drones);
  if (geo) layers.push(geo);
  const beacons = sheshnagBeaconLayer(sheshnag);
  if (beacons) layers.push(beacons);
  return layers;
}
