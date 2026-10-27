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
