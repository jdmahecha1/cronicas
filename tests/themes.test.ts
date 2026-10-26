import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEMES, type Theme } from '../src/lib/themes';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes: [string, Theme][] = [['default', DEFAULT_THEME], ...Object.entries(THEMES)];

describe('contraste WCAG AA de cada tema', () => {
  for (const [name, t] of themes) {
    it(`${name}: textos legibles sobre fondo y superficies`, () => {
      for (const bg of [t.bg, t.surface, t.raised]) {
        expect(contrast(t.text, bg), `texto sobre ${bg}`).toBeGreaterThanOrEqual(7);
        expect(contrast(t.muted, bg), `secundario sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t.accent, bg), `acento sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(t.accentInk, t.accent), 'texto sobre botón de acento').toBeGreaterThanOrEqual(4.5);
    });

    it(`${name}: bordes de controles distinguibles (>= 3:1)`, () => {
      expect(contrast(t.line, t.surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(t.line, t.bg)).toBeGreaterThanOrEqual(3);
    });
  }
});
