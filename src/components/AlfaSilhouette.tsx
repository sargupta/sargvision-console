"use client";

/** Inline SVG silhouette for SARGVISION's notional ALFA-S Chanakya platform —
 * delta-wing air-launched effects swarm drone. Top-down outline traced from
 * NewSpace Research / HAL press imagery. Stroke-only, scales cleanly.
 */
export function AlfaSilhouette({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* fuselage */}
      <path d="M32 6 L34 28 L34 50 L32 56 L30 50 L30 28 Z" fill={color} fillOpacity={0.18} />
      {/* delta wing */}
      <path d="M30 28 L8 48 L18 50 L30 44 Z" fill={color} fillOpacity={0.12} />
      <path d="M34 28 L56 48 L46 50 L34 44 Z" fill={color} fillOpacity={0.12} />
      {/* canards (forward) */}
      <path d="M30 18 L22 22 L30 24 Z" fill={color} fillOpacity={0.2} />
      <path d="M34 18 L42 22 L34 24 Z" fill={color} fillOpacity={0.2} />
      {/* tail fin */}
      <path d="M30 50 L28 56 L34 56 L32 50" fill={color} fillOpacity={0.25} />
      {/* nose dot */}
      <circle cx={32} cy={9} r={1.4} fill={color} />
    </svg>
  );
}
