/** Real drone glyphs — hand-drawn canvas silhouettes per role + affiliation.
 *
 * These read as actual drones (quadcopter top-down, fixed-wing delta,
 * hexrotor relay, command quad with chevron, jagged Shahed-style hostile)
 * rather than NATO APP-6D abstract glyphs.
 *
 * Each shape is drawn into an offscreen canvas at 64×64 once, then exported
 * as a PNG data URL and cached for deck.gl IconLayer to consume.
 */

import type { Affiliation, Role } from "./types";

interface DroneIcon {
  url: string;
  width: number;
  height: number;
}

const cache = new Map<string, DroneIcon>();

const ROLE_TINT: Record<Role, string> = {
  worker: "#00C2FF",   // electric cyan — strikers
  scout: "#4AE6A0",    // green — perimeter scouts
  relay: "#FFC83D",    // amber — comms relays
  leader: "#FF8A1F",   // saffron — command element
};

const HOSTILE_TINT = "#FF4D5E";

export function getDroneIcon(
  affiliation: Affiliation,
  role: Role,
  size = 64,
): DroneIcon {
  const key = `${affiliation}-${role}-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  if (affiliation === "hostile") {
    drawHostile(ctx, size);
  } else {
    const tint = ROLE_TINT[role];
    if (role === "scout") drawFixedWing(ctx, size, tint);
    else if (role === "relay") drawHexRelay(ctx, size, tint);
    else if (role === "leader") drawCommandQuad(ctx, size, tint);
    else drawStriker(ctx, size, tint);
  }

  const url = canvas.toDataURL("image/png");
  const out = { url, width: size, height: size };
  cache.set(key, out);
  return out;
}

// ── Striker (default cyan worker quadcopter, top-down) ────────────────

function drawStriker(ctx: CanvasRenderingContext2D, s: number, tint: string) {
  const c = s / 2;
  const r = s * 0.34;       // arm length from centre
  const rotR = s * 0.13;    // rotor radius
  const offsets = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  // arms — diagonal X
  ctx.strokeStyle = tint;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  for (const [dx, dy] of offsets) {
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + dx * r * 0.78, c + dy * r * 0.78);
    ctx.stroke();
  }

  // rotor circles
  ctx.lineWidth = 1.6;
  for (const [dx, dy] of offsets) {
    const cx = c + dx * r;
    const cy = c + dy * r;
    // soft fill behind rotor
    ctx.fillStyle = hexToRgba(tint, 0.18);
    ctx.beginPath();
    ctx.arc(cx, cy, rotR, 0, Math.PI * 2);
    ctx.fill();
    // rotor outline
    ctx.strokeStyle = tint;
    ctx.beginPath();
    ctx.arc(cx, cy, rotR, 0, Math.PI * 2);
    ctx.stroke();
    // rotor blade hint — two thin perpendicular strokes
    ctx.strokeStyle = hexToRgba(tint, 0.55);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - rotR * 0.85, cy);
    ctx.lineTo(cx + rotR * 0.85, cy);
    ctx.moveTo(cx, cy - rotR * 0.85);
    ctx.lineTo(cx, cy + rotR * 0.85);
    ctx.stroke();
    ctx.lineWidth = 1.6;
  }

  // body — rounded square, brighter fill
  const bodyR = s * 0.13;
  ctx.fillStyle = hexToRgba(tint, 0.55);
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.6;
  roundRect(ctx, c - bodyR, c - bodyR, bodyR * 2, bodyR * 2, 2);
  ctx.fill();
  ctx.stroke();
}

// ── Scout (fixed-wing delta, role colour) ─────────────────────────────

function drawFixedWing(ctx: CanvasRenderingContext2D, s: number, tint: string) {
  const c = s / 2;
  ctx.fillStyle = hexToRgba(tint, 0.55);
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.8;

  // fuselage triangle + swept wings
  ctx.beginPath();
  ctx.moveTo(c, s * 0.1);                  // nose
  ctx.lineTo(s * 0.16, s * 0.78);          // left wing tip
  ctx.lineTo(c - s * 0.07, s * 0.7);       // wing root left
  ctx.lineTo(c - s * 0.06, s * 0.92);      // tail left
  ctx.lineTo(c + s * 0.06, s * 0.92);
  ctx.lineTo(c + s * 0.07, s * 0.7);
  ctx.lineTo(s * 0.84, s * 0.78);          // right wing tip
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // cockpit dot
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.arc(c, s * 0.36, s * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // vertical fin
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c, s * 0.7);
  ctx.lineTo(c, s * 0.96);
  ctx.stroke();
}

// ── Relay (hexrotor with antenna spike) ───────────────────────────────

function drawHexRelay(ctx: CanvasRenderingContext2D, s: number, tint: string) {
  const c = s / 2;
  const r = s * 0.32;
  const rotR = s * 0.1;

  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.6;

  // 6 arms at 60° increments
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const ex = c + Math.cos(a) * r;
    const ey = c + Math.sin(a) * r;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // rotor
    ctx.fillStyle = hexToRgba(tint, 0.18);
    ctx.beginPath();
    ctx.arc(ex, ey, rotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // body
  const bodyR = s * 0.13;
  ctx.fillStyle = hexToRgba(tint, 0.7);
  ctx.strokeStyle = tint;
  ctx.beginPath();
  ctx.arc(c, c, bodyR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // antenna spike from top
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(c, c - bodyR);
  ctx.lineTo(c, c - bodyR - s * 0.18);
  ctx.stroke();
  // antenna ring (signal)
  ctx.lineWidth = 1.4;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(c, c - bodyR - s * 0.18, s * 0.04 * i, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── Leader (command quad with chevron mark) ───────────────────────────

function drawCommandQuad(ctx: CanvasRenderingContext2D, s: number, tint: string) {
  drawStriker(ctx, s, tint);
  // overlay chevron in body
  const c = s / 2;
  ctx.strokeStyle = "#0B0F14";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(c - s * 0.07, c + s * 0.025);
  ctx.lineTo(c, c - s * 0.06);
  ctx.lineTo(c + s * 0.07, c + s * 0.025);
  ctx.stroke();
}

// ── Hostile (Shahed-style swept delta + red) ──────────────────────────

function drawHostile(ctx: CanvasRenderingContext2D, s: number) {
  const c = s / 2;

  // dim red shadow ring (threat halo)
  const grad = ctx.createRadialGradient(c, c, s * 0.1, c, c, s * 0.48);
  grad.addColorStop(0, "rgba(255, 77, 94, 0.45)");
  grad.addColorStop(1, "rgba(255, 77, 94, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, s * 0.48, 0, Math.PI * 2);
  ctx.fill();

  // jagged delta wing — Shahed-style nose-forward
  ctx.fillStyle = "rgba(255, 77, 94, 0.85)";
  ctx.strokeStyle = "#0B0F14";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(c, s * 0.13);              // nose
  ctx.lineTo(s * 0.86, s * 0.74);       // right wing tip
  ctx.lineTo(c + s * 0.1, s * 0.62);    // root
  ctx.lineTo(c + s * 0.07, s * 0.92);   // tail right
  ctx.lineTo(c - s * 0.07, s * 0.92);   // tail left
  ctx.lineTo(c - s * 0.1, s * 0.62);    // root left
  ctx.lineTo(s * 0.14, s * 0.74);       // left wing tip
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // dark warhead nose
  ctx.fillStyle = "#0B0F14";
  ctx.beginPath();
  ctx.arc(c, s * 0.2, s * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // hostile cross-hair tick
  ctx.strokeStyle = "#FF4D5E";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(c - s * 0.13, s * 0.55);
  ctx.lineTo(c + s * 0.13, s * 0.55);
  ctx.stroke();
}

// ── Kill flash (orange/yellow burst sprite, used after hostile death) ─

export function getKillFlash(): DroneIcon {
  const key = "__kill_flash__";
  const hit = cache.get(key);
  if (hit) return hit;

  const s = 80;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const c = s / 2;
  const grad = ctx.createRadialGradient(c, c, s * 0.05, c, c, s * 0.45);
  grad.addColorStop(0, "rgba(255, 240, 140, 1)");
  grad.addColorStop(0.4, "rgba(255, 138, 31, 0.9)");
  grad.addColorStop(0.8, "rgba(255, 77, 94, 0.4)");
  grad.addColorStop(1, "rgba(255, 77, 94, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, s * 0.46, 0, Math.PI * 2);
  ctx.fill();
  // jagged shards
  ctx.strokeStyle = "rgba(255, 240, 140, 0.9)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * s * 0.12, c + Math.sin(a) * s * 0.12);
    ctx.lineTo(c + Math.cos(a) * s * 0.36, c + Math.sin(a) * s * 0.36);
    ctx.stroke();
  }
  const url = canvas.toDataURL("image/png");
  const out = { url, width: s, height: s };
  cache.set(key, out);
  return out;
}

export function preloadDroneIcons() {
  const affs: Affiliation[] = ["friend", "hostile"];
  const roles: Role[] = ["worker", "scout", "relay", "leader"];
  for (const a of affs) for (const r of roles) getDroneIcon(a, r);
  getKillFlash();
}

// ── Helpers ───────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
