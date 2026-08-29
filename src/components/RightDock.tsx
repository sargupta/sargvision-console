"use client";

/** RightDock — the single right-edge column for all secondary panels.
 *
 *  Layout philosophy: a commander's situation room. The map is the world;
 *  this column is the chrome around it. Three stacked zones:
 *
 *    TOP    — MissionObjectives (the mission brief)
 *    MIDDLE — RightTabPanel     (doctrine tabs: SHIELD / Vajra / Maya / ...)
 *    BOTTOM — BFTAlert          (consensus toast that slides up on votes)
 *
 *  All three are children of one absolute container at right-0 top-12, fixed
 *  width 26rem, full available height. No floating absolute children — every
 *  child renders inline within this stack via React composition, so there's
 *  zero chance of overlap with the map centre.
 *
 *  The Anduril Lattice rule: information density on the rails, clean canvas
 *  in the middle.
 */

import type { ReactNode } from "react";

export function RightDock({
  mission,
  doctrine,
  alert,
}: {
  mission: ReactNode;   // MissionObjectives (renders null when no mission)
  doctrine: ReactNode;  // RightTabPanel    (renders null when no tabs active)
  alert: ReactNode;     // BFTAlert         (renders null when no active vote)
}) {
  return (
    <aside
      className="pointer-events-auto absolute right-0 top-12 z-10 hidden md:flex w-[26rem] flex-col border-l border-[var(--color-line)] bg-[var(--color-canvas)]/95 backdrop-blur-sm"
      style={{ height: "calc(100vh - 3rem)" }}
      data-mobile-panel="dock"
    >
      {/* Top: mission objectives. Empty when scenario has no defined brief. */}
      <div
        data-explain="mission"
        className="shrink-0 empty:hidden border-b border-[var(--color-line)] empty:border-b-0"
      >
        {mission}
      </div>

      {/* Middle: doctrine tabs panel — takes the rest of the column. */}
      <div data-explain="doctrine" className="flex-1 min-h-0 overflow-hidden">
        {doctrine}
      </div>

      {/* Bottom: BFT toast region — slides in only on active consensus votes. */}
      <div className="shrink-0 empty:hidden border-t border-[var(--color-line)] empty:border-t-0">
        {alert}
      </div>
    </aside>
  );
}
