/** Basemap definitions for the SwarmMap layer-switcher.
 *
 * Three baselayers per defense-AI UI norms:
 *   1. Satellite (ESRI) — actual terrain, no API key. Augmented with AWS Open
 *      Terrain DEM tiles so the Ladakh mountains render in true 3D.
 *   2. Dark Vector (CARTO Dark Matter) — vector base for night ops / chart feel.
 *   3. Bhuvan (ISRO) — sovereign Indian demo.
 *
 * Terrain source: AWS Open Data 'terrarium' DEM, no auth, CC-BY.
 */

import type { StyleSpecification } from "maplibre-gl";

export type BasemapId = "satellite" | "dark" | "bhuvan";

// Shared 3D terrain definition — referenced by satellite + dark styles.
const TERRAIN_SOURCE = {
  type: "raster-dem" as const,
  tiles: [
    "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",
  ],
  tileSize: 256,
  encoding: "terrarium" as const,
  maxzoom: 14,
  attribution: "© Mapzen / AWS Open Data Terrarium tiles",
};

const SKY_LAYER = {
  id: "sky",
  type: "sky" as const,
  paint: {
    "sky-type": "atmosphere" as const,
    "sky-atmosphere-color": "#0E1218",
    "sky-atmosphere-halo-color": "#162032",
    "sky-atmosphere-sun-intensity": 8,
  },
};

export const BASEMAPS: Record<BasemapId, { label: string; style: string | StyleSpecification }> = {
  satellite: {
    label: "Satellite (ESRI)",
    style: {
      version: 8,
      sources: {
        esri: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "© Esri, Maxar, Earthstar Geographics",
        },
        labels: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
        },
        terrain: TERRAIN_SOURCE,
      },
      terrain: { source: "terrain", exaggeration: 1.6 },
      layers: [
        { id: "esri-imagery", type: "raster", source: "esri" },
        { id: "esri-labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.85 } },
        SKY_LAYER,
      ],
    },
  },
  dark: {
    label: "Dark Vector (CARTO)",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  bhuvan: {
    label: "Bhuvan (ISRO)",
    style: {
      version: 8,
      sources: {
        bhuvan: {
          type: "raster",
          tiles: [
            "https://bhuvanmaps.nrsc.gov.in/tilecache/tilecache.py?LAYERS=indiaImagery_3857&FORMAT=image/png&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256",
          ],
          tileSize: 256,
          attribution: "© Bhuvan NRSC ISRO",
        },
        terrain: TERRAIN_SOURCE,
      },
      terrain: { source: "terrain", exaggeration: 1.6 },
      layers: [{ id: "bhuvan-imagery", type: "raster", source: "bhuvan" }, SKY_LAYER],
    },
  },
};
