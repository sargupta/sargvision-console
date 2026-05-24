/** Basemap definitions for the SwarmMap layer-switcher.
 *
 * Three baselayers per defense-AI UI norms:
 *   1. Satellite (ESRI) — flat raster imagery, no API key.
 *   2. Dark Vector (CARTO Dark Matter) — vector base for night ops / chart feel.
 *   3. Bhuvan (ISRO) — sovereign Indian demo.
 *
 * 3D terrain was tried (terrarium DEM at exaggeration 1.4) but it z-buried the
 * deck.gl drone icons inside the mountain mesh — drones fly at sim altitude
 * ~6m AMSL while Leh's terrain elevation is ~3500m AMSL. Disabling depthTest
 * on interleaved layers didn't help because MapLibre's render pipeline resets
 * GL state between layer draws. 2D flat reads cleaner for tactical display.
 */

import type { StyleSpecification } from "maplibre-gl";

export type BasemapId = "satellite" | "dark" | "bhuvan";

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
      },
      layers: [
        { id: "esri-imagery", type: "raster", source: "esri" },
        { id: "esri-labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.85 } },
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
      },
      layers: [{ id: "bhuvan-imagery", type: "raster", source: "bhuvan" }],
    },
  },
};
