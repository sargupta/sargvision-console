/** milsymbol factory — generate NATO APP-6D symbols as PNG data URLs.
 *
 * deck.gl IconLayer wants raster (PNG/JPEG). milsymbol emits SVG, which Chrome
 * can't always decode through ImageBitmap. So we render via the library's
 * Canvas path and export a PNG data URL.
 */

import ms from "milsymbol";

import type { Affiliation, Role } from "./types";

const cache = new Map<string, { url: string; width: number; height: number }>();

// SIDC affiliation digits (APP-6D 20-char SIDC, identity bits 1-2)
const AFFIL: Record<Affiliation, string> = {
  friend: "10",
  hostile: "30",
  neutral: "40",
  unknown: "00",
};

// Role visualisation = monoColor tint on the symbol fill.
const ROLE_TINT: Record<Role, string> = {
  worker: "#00C2FF",
  scout: "#4AE6A0",
  relay: "#FFC83D",
  leader: "#FF8A1F",
};

function buildSIDC(aff: Affiliation): string {
  // APP-6D 20-character SIDC.
  // pos 1-2 standard identity, 3 symbol set (10 = Air), 4 status, 5 hq/tf/dummy,
  // 6-7 amplifier, 8-11 entity (UAV = 11001100), then 9 zeros.
  // We use a known-working canonical "Friend / Air / UAV" string and swap the
  // identity digits per affiliation.
  return `${AFFIL[aff]}030000011010000000`;
}

export function getDroneIcon(
  affiliation: Affiliation,
  role: Role,
  size = 38,
): { url: string; width: number; height: number } {
  const key = `${affiliation}-${role}-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const sym = new ms.Symbol(buildSIDC(affiliation), {
    size,
    fill: true,
    fillOpacity: 1,
    monoColor: ROLE_TINT[role],
    infoBackground: "#0E1218",
    infoColor: ROLE_TINT[role],
    outlineColor: "#0B0F14",
    outlineWidth: 2,
  });

  // milsymbol >=3 returns a 2D drawing API result. asCanvas() returns an
  // HTMLCanvasElement; toDataURL() gives us PNG that deck.gl can decode.
  const canvas: HTMLCanvasElement = (sym as unknown as { asCanvas: () => HTMLCanvasElement }).asCanvas();
  const url = canvas.toDataURL("image/png");
  const out = { url, width: canvas.width, height: canvas.height };
  cache.set(key, out);
  return out;
}

export function preloadDroneIcons(): void {
  const affs: Affiliation[] = ["friend", "hostile", "neutral", "unknown"];
  const roles: Role[] = ["worker", "scout", "relay", "leader"];
  for (const a of affs) for (const r of roles) getDroneIcon(a, r);
}
