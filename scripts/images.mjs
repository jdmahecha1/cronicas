// Optimiza el arte oficial que está en arte-original/ (no se sube al repositorio):
//  - arte-original/juegos/<juego>.*  -> public/img/juegos/<juego>.webp (portadas, tamaño original)
//  - arte-original/personajes/<saga>--<id>.* -> public/img/personajes/<saga>--<id>-<lado>.webp (128, 256; cuadradas)
//  - arte-original/paisajes/<saga>.*  -> public/img/paisajes/<saga>-<ancho>.webp (960, 1920)
//  - arte-original/<saga>.*          -> public/img/sagas/<saga>-<ancho>.webp (480, 960, 1920)
// Nunca agranda una imagen y elimina los metadatos. Uso: npm run images
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const path = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const IMAGE = /\.(jpe?g|png|webp)$/i;
const list = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => IMAGE.test(f)) : []);
const id = (file) => file.replace(/\.[^.]+$/, '');

async function save(input, output, width) {
  const info = await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(output);
  console.log(`${output.split(/[\\/]/).slice(-2).join('/')}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
}

const covers = path('arte-original/juegos/');
mkdirSync(path('public/img/juegos/'), { recursive: true });
for (const file of list(covers)) {
  await save(covers + file, path(`public/img/juegos/${id(file)}.webp`), 400);
}

// Retratos: si es un render de cuerpo entero, primero se toma la parte de arriba (la cara);
// después sharp elige el recorte cuadrado con más interés visual.
const portraits = path('arte-original/personajes/');
mkdirSync(path('public/img/personajes/'), { recursive: true });
for (const file of list(portraits)) {
  const { width: w = 0, height: h = 0 } = await sharp(portraits + file).metadata();
  const tall = h / w > 1.45;
  const region = tall ? { left: 0, top: 0, width: w, height: Math.round(Math.min(h, w * 1.15)) } : null;
  for (const side of [128, 256]) {
    let img = sharp(portraits + file);
    if (region) img = img.extract(region);
    const info = await img
      .resize({ width: side, height: side, fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 80, effort: 6 })
      .toFile(path(`public/img/personajes/${id(file)}-${side}.webp`));
    if (side === 256) console.log(`personajes/${id(file)}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB${tall ? '  (cuerpo entero)' : ''}`);
  }
}

const landscapes = path('arte-original/paisajes/');
mkdirSync(path('public/img/paisajes/'), { recursive: true });
for (const file of list(landscapes)) {
  for (const width of [960, 1920]) {
    await save(landscapes + file, path(`public/img/paisajes/${id(file)}-${width}.webp`), width);
  }
}

const sagas = path('arte-original/');
mkdirSync(path('public/img/sagas/'), { recursive: true });
for (const file of list(sagas)) {
  const meta = await sharp(sagas + file).metadata();
  for (const width of [480, 960, 1920]) {
    if (meta.width && width > meta.width) continue;
    await save(sagas + file, path(`public/img/sagas/${id(file)}-${width}.webp`), width);
  }
}
