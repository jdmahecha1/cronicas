// Descarga la portada oficial de cada juego (la imagen de la ficha de su artículo en
// la Wikipedia en inglés, a resolución reducida) y guarda su fuente para los créditos.
// Uso: npm run covers   (luego: npm run images)
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const ARTICLE = {
  'skyward-sword': 'The Legend of Zelda: Skyward Sword',
  'ocarina-of-time': 'The Legend of Zelda: Ocarina of Time',
  'twilight-princess': 'The Legend of Zelda: Twilight Princess',
  'the-wind-waker': 'The Legend of Zelda: The Wind Waker',
  'breath-of-the-wild': 'The Legend of Zelda: Breath of the Wild',
  'tears-of-the-kingdom': 'The Legend of Zelda: Tears of the Kingdom',
  rdr2: 'Red Dead Redemption 2',
  rdr1: 'Red Dead Redemption',
  'the-witcher': 'The Witcher (video game)',
  'the-witcher-2': 'The Witcher 2: Assassins of Kings',
  'the-witcher-3': 'The Witcher 3: Wild Hunt',
  'hearts-of-stone': 'The Witcher 3: Wild Hunt – Hearts of Stone',
  'blood-and-wine': 'The Witcher 3: Wild Hunt – Blood and Wine',
  'mass-effect-1': 'Mass Effect (video game)',
  'mass-effect-2': 'Mass Effect 2',
  'mass-effect-3': 'Mass Effect 3',
  'mgs-1': 'Metal Gear Solid (1998 video game)',
  'mgs-2': 'Metal Gear Solid 2: Sons of Liberty',
  'mgs-3': 'Metal Gear Solid 3: Snake Eater',
  'mgs-4': 'Metal Gear Solid 4: Guns of the Patriots',
  'mgs-v': 'Metal Gear Solid V: The Phantom Pain',
  'gow-1': 'God of War (2005 video game)',
  'gow-2': 'God of War II',
  'gow-3': 'God of War III',
  'gow-2018': 'God of War (2018 video game)',
  'gow-ragnarok': 'God of War Ragnarök',
};
const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const dir = root('src/content/sagas/');
const ids = readdirSync(dir).flatMap((f) => JSON.parse(readFileSync(dir + f, 'utf8')).games.map((g) => g.id));
const missing = ids.filter((id) => !ARTICLE[id]);
if (missing.length) console.log('Sin artículo:', missing);
const UA = { 'User-Agent': 'CronicasFanSite/1.0 (https://github.com/jdmahecha1/cronicas)' };
const API = 'https://en.wikipedia.org/w/api.php?format=json&formatversion=2&';
mkdirSync(root('arte-original/juegos/'), { recursive: true });
const out = {};
for (const [id, title] of Object.entries(ARTICLE)) {
  // 1) Imagen de la ficha (infobox) en la sección inicial del artículo.
  const rev = await fetch(API + 'action=query&redirects=1&prop=revisions&rvprop=content&rvslots=main&rvsection=0&titles=' + encodeURIComponent(title), { headers: UA }).then((r) => r.json());
  const page = rev.query.pages[0];
  const text = page.revisions?.[0]?.slots?.main?.content ?? '';
  const m = text.match(/\|\s*image\s*=\s*(?:\[\[)?(?:File:|Image:)?([^|\]\n<]+?\.(?:jpe?g|png|webp))/i);
  if (!m) { out[id] = { article: page.title, error: 'sin imagen en la ficha' }; console.log(id.padEnd(22), out[id].error); continue; }
  const file = m[1].trim();
  // 2) URL y tamaño del archivo.
  const info = await fetch(API + 'action=query&prop=imageinfo&iiprop=url|size&titles=' + encodeURIComponent('File:' + file), { headers: UA }).then((r) => r.json());
  const ii = info.query.pages[0].imageinfo?.[0];
  if (!ii) { console.log(id.padEnd(22), 'sin info'); continue; }
  // 3) Descarga del original (ya reducido por Wikipedia) para optimizarlo con `npm run images`.
  const ext = new URL(ii.url).pathname.split('.').pop().toLowerCase();
  const bytes = Buffer.from(await fetch(new URL(new URL(ii.url).pathname, ii.url), { headers: UA }).then((r) => r.arrayBuffer()));
  writeFileSync(`${root('arte-original/juegos/')}${id}.${ext}`, bytes);
  out[id] = { article: page.title, file, page: ii.descriptionurl, width: ii.width, height: ii.height };
  console.log(id.padEnd(22), `${ii.width}x${ii.height}  ${Math.round(bytes.length / 1024)} KB  ${file}`);
}
writeFileSync(root('src/content/covers.json'), JSON.stringify(out, null, 2) + '\n');
