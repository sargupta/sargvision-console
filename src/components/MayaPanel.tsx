"use client";

/** MAYA — Mean-field Adversarial Yielding Algorithm strategic posture.
 *
 *  Strategic-cadence solver (~30 s tick). Composes:
 *    1. Two-population MFG via replicator dynamics
 *    2. Wasserstein-DRO inner loop over adversary mix
 *    3. Bayesian persuasion / formless info-max signal
 *    4. Output: posture mix {defend / intercept / recon / decoy_emitter / retreat}
 *
 *  Downstream: posture vector modulates SHIELD trust threshold + VAJRA tropical β.
 */

import { Brain } from "lucide-react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import type { PostureAction } from "@/lib/types";

const POSTURE_COLOR: Record<PostureAction, string> = {
  defend: "var(--color-friend)",
  intercept: "var(--color-status-caution)",
  recon: "#67e8f9",
  decoy_emitter: "#c084fc",
  retreat: "var(--color-text-dim)",
};

const POSTURE_LABEL: Record<PostureAction, string> = {
  defend: "DEFEND",
  intercept: "INTERCEPT",
  recon: "RECON",
  decoy_emitter: "DECOY-EMIT",
  retreat: "RETREAT",
};

const ALL: PostureAction[] = ["defend", "intercept", "recon", "decoy_emitter", "retreat"];

export function MayaPanel() {
  const maya = useSwarmStore((s) => s.frame?.maya);

  if (!maya) {
    return (
      <div className="rounded-md border border-[--color-border-soft] bg-[--color-panel] p-3 text-xs text-[--color-text-vdim]">
        MAYA: idle (no strategic solve this tick)
      </div>
    );
  }

  const top = maya.top_posture;
  const totalEst = maya.hostile_estimate.reduce((s, v) => s + v, 0) || 1;
  const normalised = maya.hostile_estimate.map((v) => v / totalEst);

  return (
    <div className="rounded-md border border-[--color-border-soft] bg-[--color-panel] p-3 text-[11px]">
      <header className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[--color-text-dim]">
        <Brain className="h-3 w-3" /> MAYA — Strategic Posture
        <span className="ml-auto text-[--color-text-vdim]">
          solves={maya.n_solves}
        </span>
      </header>

      {/* Posture bar chart */}
      <div className="mb-2 grid grid-cols-5 gap-1">
        {ALL.map((a) => {
          const p = maya.posture[a] ?? 0;
          const isTop = a === top;
          return (
            <div key={a} className="flex flex-col items-center">
              <div className="relative h-12 w-full rounded-sm bg-[--color-bg]">
                <div
                  className="absolute bottom-0 w-full rounded-sm transition-all duration-500"
                  style={{
                    height: `${Math.round(p * 100)}%`,
                    background: POSTURE_COLOR[a],
                    opacity: isTop ? 1.0 : 0.6,
                  }}
                />
              </div>
              <div
                className={cn(
                  "mt-1 text-[8px] uppercase tracking-tight",
                  isTop ? "font-bold text-[--color-text]" : "text-[--color-text-dim]",
                )}
              >
                {POSTURE_LABEL[a]}
              </div>
              <div className="text-[8px] text-[--color-text-vdim]">
                {Math.round(p * 100)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Hostile mix estimate */}
      <div className="grid grid-cols-3 gap-1 border-t border-[--color-border-soft] pt-2 text-[9px]">
        <div className="text-center">
          <div className="text-[--color-text-vdim]">μ̂(decoy)</div>
          <div className="font-mono">{(normalised[0] ?? 0).toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-[--color-text-vdim]">μ̂(kinetic)</div>
          <div className="font-mono">{(normalised[1] ?? 0).toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-[--color-text-vdim]">μ̂(nuisance)</div>
          <div className="font-mono">{(normalised[2] ?? 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] text-[--color-text-vdim]">
        <span>composite value</span>
        <span className="font-mono">{maya.value.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-[9px] text-[--color-text-vdim]">
        <span>H(θ|σ) classifier entropy</span>
        <span className="font-mono">{maya.classifier_entropy.toFixed(2)}</span>
      </div>
    </div>
  );
}
