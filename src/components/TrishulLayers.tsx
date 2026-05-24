"use client";

/** Deck.gl layer builders for Operation Trishul border-strike scenario.
 *
 * Renders, conditional on `frame.trishul` being present:
 *
 *   LoC line       — dashed red PathLayer across the north
 *   HVT shields    — IconLayer with status-coloured shield glyphs + name labels
 *   HVT impact rings — PolygonLayer showing the impact radius
 *   Threat arrows  — LineLayer hostile-spawn → assigned HVT (faint amber)
 *
 * Returned as a flat list of deck.gl layers the SwarmMap composes.
 */

import { IconLayer, LineLayer, PathLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

import type { HVT, HVTStatus, TrishulSummary } from "@/lib/types";

const STATUS_COLOR: Record<HVTStatus, [number, number, number]> = {
  PROTECTED: [74, 230, 160],   // friendly green
  UNDER_ATTACK: [255, 200, 61],// caution amber
  STRUCK: [255, 77, 94],       // hostile red
};

function shieldIcon(kind: HVT["kind"], status: HVTStatus): {
  url: string;
  width: number;
  height: number;
} {
  const [r, g, b] = STATUS_COLOR[status];
  const hex = `rgb(${r},${g},${b})`;
  // SVG shield with kind label baked in. Drawn at 96×96 nominal so PNG-ish
  // rasterisation is sharp on retina.
  const label =
    kind === "military" ? "MIL" : kind === "energy" ? "ENR" : "CMD";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
    <defs><filter id='g' x='-50%' y='-50%' width='200%' height='200%'>
      <feGaussianBlur stdDeviation='2.5'/></filter></defs>
    <path d='M48 6 L86 18 L86 50 C86 70 70 84 48 90 C26 84 10 70 10 50 L10 18 Z'
          fill='${hex}' fill-opacity='0.18' stroke='${hex}' stroke-width='3'/>
    <path d='M48 6 L86 18 L86 50 C86 70 70 84 48 90 C26 84 10 70 10 50 L10 18 Z'
          fill='none' stroke='${hex}' stroke-width='1.5' filter='url(#g)' opacity='0.6'/>
    <text x='48' y='54' text-anchor='middle' font-family='ui-monospace,monospace'
          font-size='18' font-weight='700' fill='${hex}'>${label}</text>
  </svg>`;
  return {
    url: "data:image/svg+xml;utf8," + encodeURIComponent(svg),
    width: 96,
    height: 96,
  };
}

/** Build deck.gl layers for the Trishul scenario. Pass-through `[]` if absent. */
export function trishulLayers(trishul: TrishulSummary | null | undefined): Layer[] {
  if (!trishul) return [];
  const layers: Layer[] = [];

  // ── LoC line ─────────────────────────────────────────────────────────
  if (trishul.loc_line && trishul.loc_line.length >= 2) {
    const path = trishul.loc_line.map(([lon, lat]) => [lon, lat, 0]) as [
      number,
      number,
      number,
    ][];
    layers.push(
      new PathLayer({
        id: "loc-line",
        data: [{ path }],
        parameters: { depthTest: false },
        getPath: (d: { path: [number, number, number][] }) => d.path,
        getColor: [255, 77, 94, 220],
        getWidth: 3,
        widthUnits: "pixels",
        billboard: false,
        dashJustified: true,
        getDashArray: [6, 4] as [number, number],
        extensions: [],
      }) as unknown as Layer,
    );
    // LoC text label sitting just above the line midpoint.
    const mid = trishul.loc_line[Math.floor(trishul.loc_line.length / 2)];
    layers.push(
      new TextLayer({
        id: "loc-label",
        data: [{ pos: [mid[0], mid[1] + 0.0035] }],
        parameters: { depthTest: false },
        getPosition: (d: { pos: [number, number] }) => d.pos,
        getText: () => "// LoC · LINE OF CONTROL",
        getColor: [255, 77, 94, 230],
        getSize: 11,
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontWeight: 700,
        background: true,
        getBackgroundColor: [40, 8, 12, 200],
        backgroundPadding: [4, 1, 4, 1],
        sizeUnits: "pixels",
      }) as unknown as Layer,
    );
  }

  // ── HVT impact rings (drawn under icons so the shield sits on top) ───
  const RING_SEGMENTS = 36;
  const ringPolygons = trishul.hvts.map((h) => {
    // Convert impact_radius_m back into a lat/lon ring centred on the HVT.
    // Rough conversion: 1 deg lat ≈ 111_000 m at any lat.
    const radDeg = h.impact_radius_m / 111_000;
    const polygon: [number, number][] = [];
    for (let k = 0; k <= RING_SEGMENTS; k++) {
      const a = (k / RING_SEGMENTS) * Math.PI * 2;
      polygon.push([
        h.lon + Math.cos(a) * radDeg * 1.4,
        h.lat + Math.sin(a) * radDeg,
      ]);
    }
    return { polygon, hvt: h };
  });
  layers.push(
    new PolygonLayer({
      id: "hvt-rings",
      data: ringPolygons,
      parameters: { depthTest: false },
      getPolygon: (d: (typeof ringPolygons)[number]) => d.polygon,
      getFillColor: (d: (typeof ringPolygons)[number]) => {
        const [r, g, b] = STATUS_COLOR[d.hvt.status];
        return [r, g, b, 28];
      },
      getLineColor: (d: (typeof ringPolygons)[number]) => {
        const [r, g, b] = STATUS_COLOR[d.hvt.status];
        return [r, g, b, 180];
      },
      getLineWidth: 1.5,
      lineWidthUnits: "pixels",
      stroked: true,
      filled: true,
      pickable: false,
    }) as unknown as Layer,
  );

  // ── HVT shield icons ────────────────────────────────────────────────
  layers.push(
    new IconLayer({
      id: "hvt-shields",
      data: trishul.hvts,
      parameters: { depthTest: false },
      getPosition: (h: HVT) => [h.lon, h.lat, 0],
      getIcon: (h: HVT) => {
        const ic = shieldIcon(h.kind, h.status);
        return { url: ic.url, width: ic.width, height: ic.height, anchorY: 90 };
      },
      sizeUnits: "pixels",
      getSize: 56,
      sizeMinPixels: 42,
      sizeMaxPixels: 72,
      updateTriggers: {
        getIcon: trishul.hvts.map((h) => h.status).join(","),
      },
    }) as unknown as Layer,
  );

  // ── HVT name + status labels ────────────────────────────────────────
  layers.push(
    new TextLayer({
      id: "hvt-labels",
      data: trishul.hvts,
      parameters: { depthTest: false },
      getPosition: (h: HVT) => [h.lon, h.lat, 0],
      getText: (h: HVT) =>
        `${h.name}\n${h.status}${h.hits_taken > 0 ? ` · -${h.hits_taken}` : ""}`,
      getColor: (h: HVT) => {
        const [r, g, b] = STATUS_COLOR[h.status];
        return [r, g, b, 240];
      },
      getSize: 11,
      getPixelOffset: [0, 22],
      fontFamily: "JetBrains Mono, ui-monospace, monospace",
      fontWeight: 700,
      background: true,
      getBackgroundColor: [10, 14, 20, 220],
      backgroundPadding: [4, 1, 4, 1],
      sizeUnits: "pixels",
      updateTriggers: {
        getText: trishul.hvts.map((h) => `${h.status}-${h.hits_taken}`).join("|"),
        getColor: trishul.hvts.map((h) => h.status).join(","),
      },
    }) as unknown as Layer,
  );

  // ── Threat-axis arrows (hostile → assigned HVT, faint amber) ────────
  if (trishul.axis_arrows && trishul.axis_arrows.length > 0) {
    layers.push(
      new LineLayer({
        id: "trishul-axis-arrows",
        data: trishul.axis_arrows,
        parameters: { depthTest: false },
        getSourcePosition: (d) => [d.src[0], d.src[1], 0],
        getTargetPosition: (d) => [d.dst[0], d.dst[1], 0],
        getColor: [255, 200, 61, 60],
        getWidth: 1,
        widthUnits: "pixels",
      }) as unknown as Layer,
    );
  }

  return layers;
}
