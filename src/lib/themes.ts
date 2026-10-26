/**
 * Identidad visual de cada saga: colores de la interfaz y del paisaje generativo.
 * Todos los pares de texto se validan en tests/themes.test.ts (WCAG AA).
 */
export type Motif = 'mesas' | 'pines' | 'planet' | 'hills' | 'jungle' | 'volcano' | 'night';

export interface Theme {
  /** Fondo de la página. */
  bg: string;
  /** Superficie de tarjetas y paneles. */
  surface: string;
  /** Superficie elevada (hover, campos). */
  raised: string;
  /** Borde de controles: >= 3:1 contra surface. */
  line: string;
  text: string;
  muted: string;
  /** Acento para texto, nodos y foco: >= 4.5:1 contra bg y surface. */
  accent: string;
  /** Texto sobre un relleno de acento. */
  accentInk: string;
  /** Paisaje: cielo arriba/abajo, tres capas de relieve (lejos a cerca) y astro. */
  sky: [string, string];
  ridges: [string, string, string];
  glow: string;
  motif: Motif;
}

export const DEFAULT_THEME: Theme = {
  bg: '#0d0f13',
  surface: '#161a21',
  raised: '#1e232c',
  line: '#626b7d',
  text: '#eef0f3',
  muted: '#aab1bf',
  accent: '#f0b45a',
  accentInk: '#1a1206',
  sky: ['#0b1020', '#2a3350'],
  ridges: ['#1a2033', '#141927', '#0f131c'],
  glow: '#f3d9a6',
  motif: 'night',
};

export const THEMES: Record<string, Theme> = {
  'red-dead-redemption': {
    bg: '#15100c',
    surface: '#1f1712',
    raised: '#2a1f18',
    line: '#7a6352',
    text: '#f3e9de',
    muted: '#c4b3a3',
    accent: '#ec8a55',
    accentInk: '#1c0d05',
    sky: ['#3b1f16', '#c4643a'],
    ridges: ['#7c3d24', '#4f2618', '#2a150e'],
    glow: '#f7c27e',
    motif: 'mesas',
  },
  'the-witcher': {
    bg: '#0d1013',
    surface: '#151a1f',
    raised: '#1d242b',
    line: '#62707d',
    text: '#eef2f5',
    muted: '#aab6c1',
    accent: '#d6e0e8',
    accentInk: '#10161b',
    sky: ['#121a21', '#4b5d6b'],
    ridges: ['#2a3a46', '#1a252e', '#0f161c'],
    glow: '#e9eff3',
    motif: 'pines',
  },
  'mass-effect': {
    bg: '#080d17',
    surface: '#0f1726',
    raised: '#162135',
    line: '#4f6584',
    text: '#eaf2fb',
    muted: '#a6b8cf',
    accent: '#5cbaf7',
    accentInk: '#04121f',
    sky: ['#050a14', '#16345c'],
    ridges: ['#1b2d4a', '#122038', '#0a1424'],
    glow: '#7fc8f8',
    motif: 'planet',
  },
  'the-legend-of-zelda': {
    bg: '#0d120e',
    surface: '#141c16',
    raised: '#1b261e',
    line: '#5d735f',
    text: '#eef4ea',
    muted: '#b0c2ad',
    accent: '#e6c862',
    accentInk: '#1a1503',
    sky: ['#17312f', '#86ad8b'],
    ridges: ['#3f6648', '#284634', '#152a1d'],
    glow: '#f3df92',
    motif: 'hills',
  },
  'metal-gear-solid': {
    bg: '#0a0e0b',
    surface: '#111813',
    raised: '#18221a',
    line: '#557259',
    text: '#e9f3ea',
    muted: '#a9c1ac',
    accent: '#8fe09b',
    accentInk: '#06150a',
    sky: ['#0a1610', '#24402c'],
    ridges: ['#1f3626', '#15261b', '#0c1710'],
    glow: '#b5f0bd',
    motif: 'jungle',
  },
  'god-of-war': {
    bg: '#120d0c',
    surface: '#1b1412',
    raised: '#251b18',
    line: '#7a5f57',
    text: '#f5ebe7',
    muted: '#c9b2aa',
    accent: '#f5774f',
    accentInk: '#1d0904',
    sky: ['#1f0e0b', '#7a2a1b'],
    ridges: ['#4a2219', '#2e1611', '#1a0d0a'],
    glow: '#ffb07a',
    motif: 'volcano',
  },
};

export function themeFor(sagaId?: string): Theme {
  return (sagaId && THEMES[sagaId]) || DEFAULT_THEME;
}

/** Variables CSS del tema, para el atributo style de <body> o de una tarjeta. */
export function themeStyle(theme: Theme): string {
  return [
    `--bg:${theme.bg}`,
    `--surface:${theme.surface}`,
    `--raised:${theme.raised}`,
    `--line:${theme.line}`,
    `--text:${theme.text}`,
    `--muted:${theme.muted}`,
    `--accent:${theme.accent}`,
    `--accent-ink:${theme.accentInk}`,
  ].join(';');
}
