"use client";

/** Deck.gl layer builders for the GOVERNED MIGRATION scenario.
 *
 * Renders:
 *   - Zone circles colored by kind (start/end/corridor/thermal/rest)
 *   - Zone name + occupancy/capacity badge above each circle
 *   - Hazard storm cells (red, pulsing)
 *
 * Returned as a list of deck.gl layers the SwarmMap composes.
 */

import { PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

import type { MigrationSummary } from "@/lib/types";

// Generate a circular polygon (in degrees lat/lon) of N vertices.
function circlePolygon(
  lon: number,
  lat: number,
  radius_m: number,
  vertices = 48,
): [number, number][] {
  // Approx: 1 degree latitude ≈ 111_320 m; longitude ≈ 111_320 * cos(lat).
  const dLat = radius_m / 111_320;
  const dLon = radius_m / (111_320 * Math.cos((lat * Math.PI) / 180));
  const pts: [number, number][] = [];
  for (let i = 0; i < vertices; i++) {
    const ang = (i / vertices) * 2 * Math.PI;
    pts.push([lon + Math.cos(ang) * dLon, lat + Math.sin(ang) * dLat]);
  }
  return pts;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function migrationLayers(mig: MigrationSummary | null | undefined): Layer[] {
  if (!mig) return [];

  // Zone fill polygons
  const zoneFillData = mig.zones.map((z) => ({
    polygon: circlePolygon(z.lon, z.lat, z.radius_m),
    color: hexToRgb(z.color),
    zone: z,
  }));

  const zoneFillLayer = new PolygonLayer({
    id: "mig-zone-fills",
    data: zoneFillData,
    getPolygon: (d) => d.polygon,
    getFillColor: (d: (typeof zoneFillData)[number]) => {
      if (d.zone.closed) {
        // Closed pass = red X-hatched fill
        return [255, 77, 94, 70];
      }
      const [r, g, b] = d.color;
      const loadFrac = d.zone.capacity > 0 ? d.zone.occupancy / d.zone.capacity : 0;
      const alpha = Math.round(20 + 35 * Math.min(1, loadFrac));
      return [r, g, b, alpha];
    },
    getLineColor: (d: (typeof zoneFillData)[number]) =>
      d.zone.closed ? [255, 77, 94, 240] : [...d.color, 170],
    getLineWidth: (d: (typeof zoneFillData)[number]) => (d.zone.closed ? 3 : 2),
    lineWidthUnits: "pixels",
    stroked: true,
    filled: true,
    updateTriggers: {
      getFillColor: [mig.zones.map((z) => `${z.occupancy}/${z.closed}`).join(",")],
      getLineColor: [mig.zones.map((z) => z.closed).join(",")],
      getLineWidth: [mig.zones.map((z) => z.closed).join(",")],
    },
  });

  // Zone labels (name + occupancy/capacity, "CLOSED" badge if shut)
  const zoneLabelLayer = new TextLayer({
    id: "mig-zone-labels",
    data: mig.zones,
    getPosition: (z) => [z.lon, z.lat, z.alt_m + 5],
    getText: (z) =>
      z.closed
        ? `⛔ ${z.name}\nCLOSED`
        : `${z.name}\n${z.occupancy}/${z.capacity}`,
    getColor: (z) => {
      if (z.closed) return [255, 77, 94, 240];
      const [r, g, b] = hexToRgb(z.color);
      return [r, g, b, 240];
    },
    getSize: 11,
    getPixelOffset: [0, 0],
    fontFamily: "JetBrains Mono, ui-monospace, monospace",
    fontWeight: 700,
    background: true,
    getBackgroundColor: [10, 14, 20, 220],
    backgroundPadding: [4, 2, 4, 2],
    sizeUnits: "pixels",
  });

  // Hazard storm circles (red, pulsing on phase)
  const hazardFillData = mig.hazards.map((h) => ({
    polygon: circlePolygon(h.lon, h.lat, h.radius_m * (0.9 + 0.15 * Math.sin(h.pulse_phase))),
    hazard: h,
  }));
  const hazardFillLayer = new PolygonLayer({
    id: "mig-hazard-fills",
    data: hazardFillData,
    getPolygon: (d) => d.polygon,
    getFillColor: (d: (typeof hazardFillData)[number]) => [
      255,
      77,
      94,
      Math.round(40 + 50 * d.hazard.severity),
    ],
    getLineColor: [255, 77, 94, 220],
    getLineWidth: 2,
    lineWidthUnits: "pixels",
    stroked: true,
    filled: true,
    updateTriggers: { getFillColor: [mig.hazards.map((h) => h.pulse_phase.toFixed(2)).join(",")] },
  });

  // Hazard center markers + labels
  const hazardCenterLayer = new ScatterplotLayer({
    id: "mig-hazard-centers",
    data: mig.hazards,
    getPosition: (h) => [h.lon, h.lat, h.alt_m],
    getFillColor: [255, 77, 94, 240],
    getRadius: 4,
    radiusUnits: "pixels",
  });

  const hazardLabelLayer = new TextLayer({
    id: "mig-hazard-labels",
    data: mig.hazards,
    getPosition: (h) => [h.lon, h.lat, h.alt_m + 3],
    getText: (h) => `⚠ ${h.name}`,
    getColor: [255, 200, 200, 230],
    getSize: 10,
    getPixelOffset: [0, -22],
    fontFamily: "JetBrains Mono, ui-monospace, monospace",
    fontWeight: 700,
    background: true,
    getBackgroundColor: [60, 8, 12, 220],
    backgroundPadding: [4, 1, 4, 1],
    sizeUnits: "pixels",
  });

  // Drone trail streaks (Trilateral-style blue flow)
  const trailData = (mig.trails ?? []).filter((t) => t.path.length >= 2);
  const trailLayer = new PathLayer({
    id: "mig-trails",
    data: trailData,
    getPath: (d) => d.path,
    getColor: [0, 194, 255, 150],
    getWidth: 1.5,
    widthUnits: "pixels",
  });

  return [
    zoneFillLayer,
    hazardFillLayer,
    hazardCenterLayer,
    trailLayer,
    hazardLabelLayer,
    zoneLabelLayer,
  ];
}
