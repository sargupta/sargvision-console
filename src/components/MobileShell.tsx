"use client";

/** MobileShell — wraps the desktop panels (AssetRail, RightDock, CommsLog)
 *  in bottom-sheet drawers triggered by FAB buttons. Renders only on screens
 *  below the Tailwind `md` breakpoint (<768px). The desktop panels themselves
 *  are hidden below `md` via their own `hidden md:flex` rules, so this is the
 *  only way to access them on a phone.
 *
 *  Layout philosophy on phones: the map is the world; everything else is a
 *  drawer that slides up from the bottom edge on demand. FABs live in a
 *  bottom-right column so they don't compete with the phase banner at the
 *  bottom-centre.
 */

import { Crosshair, Layers, Radio, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type DrawerId = "assets" | "dock" | "wirelog" | null;

export function MobileShell({
  assets,
  dock,
  wirelog,
}: {
  assets: ReactNode;
  dock: ReactNode;
  wirelog: ReactNode;
}) {
  const [open, setOpen] = useState<DrawerId>(null);

  // Esc closes the open drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* FAB column — bottom-right, mobile-only */}
      <div className="pointer-events-auto fixed bottom-20 right-3 z-40 flex flex-col gap-2 md:hidden">
        <FabButton
          label="Assets"
          Icon={Crosshair}
          active={open === "assets"}
          onClick={() => setOpen(open === "assets" ? null : "assets")}
        />
        <FabButton
          label="Mission"
          Icon={Layers}
          active={open === "dock"}
          onClick={() => setOpen(open === "dock" ? null : "dock")}
        />
        <FabButton
          label="Wire"
          Icon={Radio}
          active={open === "wirelog"}
          onClick={() => setOpen(open === "wirelog" ? null : "wirelog")}
        />
      </div>

      {/* Bottom-sheet drawer — slides up from the bottom edge */}
      {open && (
        <div
          className="pointer-events-auto fixed inset-0 z-50 flex flex-col md:hidden"
          onClick={() => setOpen(null)}
        >
          {/* Scrim */}
          <div className="flex-1 bg-[var(--color-canvas)]/60 backdrop-blur-sm" />
          {/* Sheet */}
          <div
            className="relative max-h-[75vh] overflow-hidden border-t border-[var(--color-line)] bg-[var(--color-canvas)]/97 backdrop-blur-md"
            style={{
              animation: "mobile-sheet-slide-up 200ms ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-elevated)]/30 px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
              <span>{open === "assets" ? "Assets" : open === "dock" ? "Mission · Doctrine" : "Wire log"}</span>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-[1px] p-1 text-[var(--color-text-dim)] hover:bg-[var(--color-elevated)]/60 hover:text-[var(--color-text)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="scrollbar-hidden max-h-[calc(75vh-2.5rem)] overflow-y-auto">
              {open === "assets" && <div data-mobile-drawer="assets">{assets}</div>}
              {open === "dock" && <div data-mobile-drawer="dock">{dock}</div>}
              {open === "wirelog" && <div data-mobile-drawer="wirelog">{wirelog}</div>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mobile-sheet-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        [data-mobile-drawer] [data-mobile-panel] {
          position: static !important;
          display: flex !important;
          width: 100% !important;
          height: auto !important;
          max-height: none !important;
          border: none !important;
          backdrop-filter: none !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
        }
      `}</style>
    </>
  );
}

function FabButton({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex h-12 w-12 flex-col items-center justify-center rounded-[2px] border backdrop-blur-md transition-colors " +
        (active
          ? "border-[var(--color-friend)]/60 bg-[var(--color-friend)]/15 text-[var(--color-friend)]"
          : "border-[var(--color-line)] bg-[var(--color-canvas)]/90 text-[var(--color-text-dim)] hover:border-[var(--color-friend)]/40 hover:text-[var(--color-text)]")
      }
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
      <span className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em]">{label}</span>
    </button>
  );
}
