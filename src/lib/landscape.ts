import type { Motif, Theme } from './themes';

/**
 * Paisajes generativos y deterministas para cada saga: relieve, astro y niebla
 * dibujados con una semilla. Son ilustraciones originales (sin personajes,
 * logos ni arte de los juegos) y pesan unos pocos KB de SVG.
 */
export const W = 1600;
export const H = 800;

export interface Shape {
  d: string;
  fill: string;
  opacity?: number;
}

export interface Dot {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

export interface Scene {
  sky: [string, string];
  glow: string;
  body: { cx: number; cy: number; r: number; ring: boolean } | null;
  stars: Dot[];
  embers: Dot[];
  layers: Shape[];
  scanlines: boolean;
}

function rng(seedText: string) {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n);

/** Línea de relieve suave: suma de senos con fases aleatorias. */
function ridgeLine(rand: () => number, base: number, amp: number, waves = 3, step = 40): [number, number][] {
  const phases = Array.from({ length: waves }, () => rand() * Math.PI * 2);
  const freqs = Array.from({ length: waves }, (_, i) => (i + 1) * (0.6 + rand() * 0.8));
  const pts: [number, number][] = [];
  for (let x = 0; x <= W; x += step) {
    let y = 0;
    for (let i = 0; i < waves; i++) y += Math.sin((x / W) * Math.PI * 2 * freqs[i] + phases[i]) / (i + 1);
    pts.push([x, base - y * amp]);
  }
  return pts;
}

function closed(pts: [number, number][]): string {
  return `M0 ${H} ` + pts.map(([x, y]) => `L${r1(x)} ${r1(y)}`).join(' ') + ` L${W} ${H} Z`;
}

/** Mesetas del desierto: cimas planas con laderas abruptas. */
function mesas(rand: () => number, base: number, height: number): string {
  const pts: [number, number][] = [[0, base]];
  let x = 0;
  while (x < W) {
    const gap = 80 + rand() * 220;
    const width = 120 + rand() * 260;
    const top = base - height * (0.45 + rand() * 0.55);
    pts.push([x + gap, base], [x + gap + 30, top], [x + gap + width, top], [x + gap + width + 40, base]);
    x += gap + width + 40;
  }
  pts.push([W, base]);
  return closed(pts);
}

/** Pinos en forma de triángulo sobre una línea de relieve. */
function pines(rand: () => number, line: [number, number][], size: number): string {
  let d = closed(line);
  for (let i = 0; i < line.length - 1; i++) {
    if (rand() < 0.25) continue;
    const [x, y] = line[i];
    const h = size * (0.6 + rand() * 0.8);
    d += ` M${r1(x - h * 0.28)} ${r1(y + 4)} L${r1(x)} ${r1(y - h)} L${r1(x + h * 0.28)} ${r1(y + 4)} Z`;
  }
  return d;
}

/** Copa de selva: muchas lomas redondeadas. */
function canopy(rand: () => number, line: [number, number][]): string {
  let d = `M0 ${H} L0 ${r1(line[0][1])}`;
  for (let i = 0; i < line.length - 1; i++) {
    const [x1, y1] = line[i];
    const [x2, y2] = line[i + 1];
    const bump = 18 + rand() * 30;
    d += ` Q${r1((x1 + x2) / 2)} ${r1(Math.min(y1, y2) - bump)} ${r1(x2)} ${r1(y2)}`;
  }
  return d + ` L${W} ${H} Z`;
}

/** Picos dentados con un volcán central. */
function peaks(rand: () => number, base: number, height: number, volcano: boolean): string {
  const pts: [number, number][] = [];
  for (let x = 0; x <= W; x += 60 + rand() * 50) {
    const nearCenter = volcano ? Math.max(0, 1 - Math.abs(x - W * 0.55) / 380) : 0;
    const crater = volcano && Math.abs(x - W * 0.55) < 60;
    const h = crater ? height * 0.92 : height * (0.25 + rand() * 0.45 + nearCenter * 0.75);
    pts.push([x, base - h]);
  }
  pts.push([W, base - height * 0.3]);
  return closed(pts);
}

function dots(rand: () => number, n: number, maxY: number, rMax: number): Dot[] {
  return Array.from({ length: n }, () => ({
    cx: r1(rand() * W),
    cy: r1(rand() * maxY),
    r: Math.round((0.6 + rand() * rMax) * 10) / 10,
    opacity: Math.round((0.25 + rand() * 0.6) * 100) / 100,
  }));
}

export function buildScene(seedText: string, theme: Theme): Scene {
  const rand = rng(seedText);
  const [far, mid, near] = theme.ridges;
  const motif: Motif = theme.motif;
  const scene: Scene = {
    sky: theme.sky,
    glow: theme.glow,
    body: null,
    stars: [],
    embers: [],
    layers: [],
    scanlines: false,
  };

  switch (motif) {
    case 'mesas':
      scene.body = { cx: r1(W * (0.62 + rand() * 0.2)), cy: 330, r: 90, ring: false };
      scene.layers = [
        { d: mesas(rand, 560, 260), fill: far },
        { d: mesas(rand, 650, 220), fill: mid },
        { d: closed(ridgeLine(rand, 720, 30, 2)), fill: near },
      ];
      break;
    case 'pines':
      scene.body = { cx: r1(W * (0.2 + rand() * 0.2)), cy: 210, r: 54, ring: false };
      scene.stars = dots(rand, 40, 380, 1.2);
      scene.layers = [
        { d: closed(ridgeLine(rand, 470, 90, 3)), fill: far },
        { d: pines(rand, ridgeLine(rand, 590, 60, 3, 26), 70), fill: mid },
        { d: pines(rand, ridgeLine(rand, 700, 40, 2, 34), 110), fill: near },
      ];
      break;
    case 'planet':
      scene.body = { cx: r1(W * (0.66 + rand() * 0.12)), cy: 300, r: 210, ring: true };
      scene.stars = dots(rand, 120, 760, 1.4);
      scene.layers = [
        { d: closed(ridgeLine(rand, 640, 40, 4)), fill: far },
        { d: closed(ridgeLine(rand, 700, 26, 3)), fill: mid },
        { d: closed(ridgeLine(rand, 760, 14, 2)), fill: near },
      ];
      break;
    case 'hills':
      scene.body = { cx: r1(W * (0.7 + rand() * 0.15)), cy: 240, r: 70, ring: false };
      scene.layers = [
        { d: closed(ridgeLine(rand, 500, 80, 2)), fill: far },
        { d: closed(ridgeLine(rand, 600, 70, 2)), fill: mid },
        { d: closed(ridgeLine(rand, 700, 50, 2)), fill: near },
      ];
      break;
    case 'jungle':
      scene.body = { cx: r1(W * (0.25 + rand() * 0.2)), cy: 260, r: 60, ring: false };
      scene.scanlines = true;
      scene.layers = [
        { d: closed(ridgeLine(rand, 470, 110, 3)), fill: far },
        { d: canopy(rand, ridgeLine(rand, 610, 40, 3, 48)), fill: mid },
        { d: canopy(rand, ridgeLine(rand, 710, 30, 2, 64)), fill: near },
      ];
      break;
    case 'volcano':
      scene.body = { cx: r1(W * 0.55), cy: 300, r: 140, ring: false };
      scene.embers = dots(rand, 60, 620, 1.8);
      scene.layers = [
        { d: peaks(rand, 640, 380, true), fill: far },
        { d: peaks(rand, 700, 220, false), fill: mid },
        { d: closed(ridgeLine(rand, 760, 22, 2)), fill: near },
      ];
      break;
    default:
      scene.body = { cx: r1(W * (0.72 + rand() * 0.12)), cy: 220, r: 60, ring: false };
      scene.stars = dots(rand, 90, 520, 1.3);
      scene.layers = [
        { d: closed(ridgeLine(rand, 560, 90, 3)), fill: far },
        { d: closed(ridgeLine(rand, 650, 70, 3)), fill: mid },
        { d: closed(ridgeLine(rand, 730, 40, 2)), fill: near },
      ];
  }
  return scene;
}
