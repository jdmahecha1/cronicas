// Optimiza el arte oficial que está en arte-original/ (no se sube al repositorio):
//  - arte-original/juegos/<juego>.*  -> public/img/juegos/<juego>.webp (portadas, tamaño original)
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

const sagas = path('arte-original/');
mkdirSync(path('public/img/sagas/'), { recursive: true });
for (const file of list(sagas)) {
  const meta = await sharp(sagas + file).metadata();
  for (const width of [480, 960, 1920]) {
    if (meta.width && width > meta.width) continue;
    await save(sagas + file, path(`public/img/sagas/${id(file)}-${width}.webp`), width);
  }
}
