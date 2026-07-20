"use client";

/**
 * THE SOUND LAYER (pass 6 big-swing; STUBS #15) — the draw ritual, scored.
 * Entirely synthesized with Web Audio at call time: zero asset files, zero
 * network. OFF by default, opt-in via the stage-bar pill, persisted, and
 * hard-muted when the tab is hidden. Sounds mark moments that already happen —
 * nothing here ever implies an outcome that didn't (honesty rails intact).
 */

import { useSyncExternalStore } from "react";

const KEY = "vd-sound-v1";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    document.addEventListener("visibilitychange", () => {
      if (!ctx) return;
      if (document.hidden) void ctx.suspend();
      else if (enabled) void ctx.resume();
    });
  }
  return ctx;
}

export function soundEnabled(): boolean {
  return enabled;
}

export function initSound(): void {
  if (typeof window === "undefined") return;
  enabled = localStorage.getItem(KEY) === "on";
  // The context itself is only created on a user gesture (toggle) — browsers
  // block autoplay audio, and silence-until-asked is the right default anyway.
}

export function setSound(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  if (on) {
    const c = ensureCtx();
    void c?.resume();
    tick(); // audible confirmation at toggle
  }
  emit();
}

export function subscribeSound(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Reactive enabled-state for the pill. */
export function useSound(): boolean {
  return useSyncExternalStore(subscribeSound, soundEnabled, () => false);
}

/* ---------------- voices ---------------- */

function now(): number {
  return ctx?.currentTime ?? 0;
}

function env(g: GainNode, t0: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function tone(
  freq: number,
  t0: number,
  peak: number,
  attack: number,
  decay: number,
  type: OscillatorType = "sine",
  detune = 0,
) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  env(g, t0, peak, attack, decay);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + attack + decay + 0.05);
}

function guard(): boolean {
  if (!enabled) return false;
  const c = ensureCtx();
  if (!c) return false;
  if (c.state === "suspended") void c.resume();
  return true;
}

/** Soft mechanical tick — chip taps, toggles. */
export function tick(): void {
  if (!guard()) return;
  tone(1800, now(), 0.06, 0.002, 0.05, "square");
  tone(700, now(), 0.05, 0.002, 0.08, "sine");
}

/** 3s riser locked to CHARGE — filtered noise sweeping up under a rising fifth. */
export function chargeRiser(): void {
  if (!guard() || !ctx || !master) return;
  const t0 = now();
  const dur = 2.8;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 6;
  filter.frequency.setValueAtTime(160, t0);
  filter.frequency.exponentialRampToValueAtTime(2400, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.11, t0 + dur * 0.85);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
  tone(196, t0, 0.05, 0.4, dur - 0.4, "sine");
  tone(294, t0 + dur * 0.5, 0.05, 0.3, dur * 0.5, "sine");
}

/** The RESOLVE strike — a struck bell (fundamental + inharmonic partials). */
export function resolveStrike(): void {
  if (!guard()) return;
  const t0 = now();
  tone(523.25, t0, 0.22, 0.005, 1.6, "sine");
  tone(783.99, t0, 0.12, 0.005, 1.1, "sine", 4);
  tone(1318.5, t0, 0.07, 0.005, 0.7, "sine", -6);
  tone(130.8, t0, 0.1, 0.01, 0.9, "triangle");
}

/** Crowns blooming — staggered pentatonic plinks matching the 45ms delays. */
export function crownShimmer(count = 8): void {
  if (!guard()) return;
  const t0 = now();
  const scale = [1046.5, 1174.7, 1318.5, 1568, 1760]; // C6 pentatonic
  for (let i = 0; i < Math.min(count, 10); i++) {
    tone(scale[i % scale.length] * (i > 4 ? 2 : 1), t0 + i * 0.045, 0.05, 0.003, 0.5, "sine");
  }
}

/** Personal win — rising major chime. Rare by odds; it should feel like it. */
export function winChime(): void {
  if (!guard()) return;
  const t0 = now();
  [523.25, 659.25, 784, 1046.5].forEach((f, i) => {
    tone(f, t0 + i * 0.09, 0.16, 0.005, 1.2, "sine");
    tone(f * 2, t0 + i * 0.09, 0.05, 0.005, 0.8, "sine", 5);
  });
}

/** Mega ignition — sub boom + long shimmer. */
export function megaBoom(): void {
  if (!guard() || !ctx || !master) return;
  const t0 = now();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(120, t0);
  o.frequency.exponentialRampToValueAtTime(38, t0 + 1.4);
  env(g, t0, 0.4, 0.01, 1.6);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + 1.8);
  crownShimmer(10);
  tone(261.6, t0 + 0.3, 0.1, 0.05, 2.2, "sine");
}
