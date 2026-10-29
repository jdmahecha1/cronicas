import art from '../content/art.json';
import covers from '../content/covers.json';

/**
 * Portadas oficiales de los juegos (arte promocional de las editoras), tal como las
 * publica Wikipedia a resolución reducida. Se usan sin fines comerciales y con
 * crédito en /creditos/. Las genera `npm run covers` + `npm run images`.
 */
export interface Cover {
  gameId: string;
  /** Archivo en Wikipedia y página donde se documenta (fuente del crédito). */
  file: string;
  page: string;
  width: number;
  height: number;
}

/** Titular de los derechos de cada saga, para el crédito. */
export const OWNERS: Record<string, string> = {
  'the-legend-of-zelda': 'Nintendo',
  'red-dead-redemption': 'Rockstar Games',
  'the-witcher': 'CD Projekt',
  'mass-effect': 'Electronic Arts y BioWare',
  'metal-gear-solid': 'Konami',
  'god-of-war': 'Sony Interactive Entertainment',
};

/** Juego cuya portada representa a la saga en su cabecera y en la portada del sitio. */
export const SAGA_COVER: Record<string, string> = {
  'the-legend-of-zelda': 'tears-of-the-kingdom',
  'red-dead-redemption': 'rdr2',
  'the-witcher': 'the-witcher-3',
  'mass-effect': 'mass-effect-2',
  'metal-gear-solid': 'mgs-4',
  'god-of-war': 'gow-2018',
};

const COVERS = covers as Record<string, Omit<Cover, 'gameId'> & { error?: string }>;

export function coverFor(gameId: string): Cover | undefined {
  const c = COVERS[gameId];
  return c && !c.error ? { gameId, file: c.file, page: c.page, width: c.width, height: c.height } : undefined;
}

export function sagaCover(sagaId: string): Cover | undefined {
  const gameId = SAGA_COVER[sagaId];
  return gameId ? coverFor(gameId) : undefined;
}

export function coverSrc(gameId: string): string {
  return `img/juegos/${gameId}.webp`;
}

/** Las portadas apaisadas no se recortan: se muestran completas. */
export function isLandscape(cover: Cover): boolean {
  return cover.width / cover.height > 0.85;
}

/**
 * Retratos de personajes y paisajes de cada saga, tomados de las wikis de Fandom
 * (arte oficial y capturas de los juegos). art.json guarda el archivo y su página
 * de origen; las genera `npm run art:manifest` + `npm run images`.
 */
export interface FandomArt {
  wiki: string;
  file: string;
  page: string;
}

const ART = art as { portraits: Record<string, FandomArt>; landscapes: Record<string, FandomArt> };

export const portraitKey = (sagaId: string, characterId: string) => `${sagaId}--${characterId}`;

export function portraitFor(sagaId: string, characterId: string): FandomArt | undefined {
  return ART.portraits[portraitKey(sagaId, characterId)];
}

/** Retrato cuadrado (128 o 256 px de lado), o nada si el personaje no tiene. */
export function portraitSrc(sagaId: string, characterId: string, side: 128 | 256 = 128): string | undefined {
  return portraitFor(sagaId, characterId) ? `img/personajes/${portraitKey(sagaId, characterId)}-${side}.webp` : undefined;
}

export function landscapeFor(sagaId: string): FandomArt | undefined {
  return ART.landscapes[sagaId];
}

export function landscapeSrc(sagaId: string, width: 960 | 1920): string {
  return `img/paisajes/${sagaId}-${width}.webp`;
}
