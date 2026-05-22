/** milsymbol factory — generate NATO APP-6D symbols as PNG data URLs.
 *
 * SIDC = Symbol Identification Code (20-digit string).
 * Friend / Air / UAV / Rotary or Fixed-wing.
 *   10  = standard identity = Friend
 *   03  = symbol set = Air
 *   1   = status (present)
 *   000 = headquarters/task force/dummy modifier
 *   01101 = entity = UAV
 *   000000 = modifiers
 *
 * We cache PNG icon atlases keyed by (affiliation, role).
 */

import ms from "milsymbol";

import type { Affiliation, Role } from "./types";

const cache = new Map<string, { url: string; width: number; height: number }>();

// SIDC affiliation digits
const AFFIL: Record<Affiliation, string> = {
  friend: "10",
  hostile: "30",
  neutral: "40",
  unknown: "00",
};

// Role visualization via color tint on the disc behind the icon
const ROLE_TINT: Record<Role, string> = {
  worker: "#00C2FF",
  scout: "#4AE6A0",
  relay: "#FFC83D",
  leader: "#FF8A1F",
};

export function getDroneIcon(
  affiliation: Affiliation,
  role: Role,
  size = 36,
): { url: string; width: number; height: number } {
  const key = `${affiliation}-${role}-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const sidc =
    AFFIL[affiliation] + "0" + "31" + "0" + "00" + "01101" + "00" + "0000";
  // APP-6D variant of UAV (entity 01101)

  const sym = new ms.Symbol(sidc, {
    size,
    fill: true,
    fillOpacity: 1,
    colorMode: "Dark",
    monoColor: ROLE_TINT[role],
    outlineColor: "#0B0F14",
    outlineWidth: 2,
  });

  const svg = sym.asSVG();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const bbox = sym.getSize();
  const out = {
    url,
    width: Math.ceil(bbox.width),
    height: Math.ceil(bbox.height),
  };
  cache.set(key, out);
  return out;
}

/** Pre-warm common variants. */
export function preloadDroneIcons() {
  const affs: Affiliation[] = ["friend", "hostile", "neutral", "unknown"];
  const roles: Role[] = ["worker", "scout", "relay", "leader"];
  for (const a of affs) for (const r of roles) getDroneIcon(a, r);
}
