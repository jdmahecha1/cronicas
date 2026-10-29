// Arma src/content/art.json: para cada personaje y paisaje, el archivo elegido en la wiki
// de Fandom de su saga, su página de origen (para los créditos) y la URL de descarga.
// Fandom no permite descargas automáticas, así que las imágenes se bajan desde el
// navegador (ver la sección sobre el contenido del README). Uso: npm run art:manifest
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const cfg = JSON.parse(readFileSync(root('src/content/art-sources.json'), 'utf8'));
const UA = { 'User-Agent': 'CronicasFanSite/1.0 (https://github.com/jdmahecha1/cronicas)' };

async function api(wiki, params) {
  const url = `https://${wiki}/api.php?format=json&redirects=1&${params}`;
  return fetch(url, { headers: UA }).then((r) => r.json());
}

/** Imagen principal de cada página (la que la wiki usa en su ficha). */
async function pageImages(wiki, titles) {
  const data = await api(wiki, 'action=query&prop=pageimages&piprop=name&titles=' + encodeURIComponent(titles.join('|')));
  const redir = new Map([...(data.query.normalized ?? []), ...(data.query.redirects ?? [])].map((r) => [r.from, r.to]));
  const byTitle = new Map(Object.values(data.query.pages).map((p) => [p.title, p.pageimage]));
  return (t) => { while (redir.has(t)) t = redir.get(t); return byTitle.get(t); };
}

async function fileInfo(wiki, files) {
  const data = await api(wiki, 'action=query&prop=imageinfo&iiprop=url|size&titles=' + encodeURIComponent(files.map((f) => `File:${f}`).join('|')));
  const redir = new Map((data.query.normalized ?? []).map((r) => [r.to, r.from]));
  const out = new Map();
  for (const p of Object.values(data.query.pages)) {
    const ii = p.imageinfo?.[0];
    if (ii) out.set((redir.get(p.title) ?? p.title).replace(/^File:/, '').replace(/_/g, ' '), ii);
  }
  return out;
}

/** URL reducida en el servidor de Fandom: no hace falta bajar el original enorme. */
const scaled = (url, width) => url.replace(/\/revision\/latest(\?|$)/, `/revision/latest/scale-to-width-down/${width}$1`);

const art = { portraits: {}, landscapes: {} };
for (const [saga, chars] of Object.entries(cfg.characters)) {
  const wiki = cfg.wikis[saga];
  const main = await pageImages(wiki, Object.values(chars));
  const picks = Object.entries(chars).map(([id, title]) => [id, cfg.overrides[`${saga}--${id}`] ?? main(title)]);
  const landscape = cfg.landscapes[saga];
  const info = await fileInfo(wiki, [...picks.map(([, f]) => f).filter(Boolean), landscape]);
  const norm = (f) => f?.replace(/_/g, ' ');
  for (const [id, file] of picks) {
    const ii = info.get(norm(file));
    if (!ii) { console.log(`sin imagen: ${saga}/${id}`); continue; }
    art.portraits[`${saga}--${id}`] = { wiki, file: norm(file), page: ii.descriptionurl, download: scaled(ii.url, 640) };
  }
  const li = info.get(norm(landscape));
  if (li) art.landscapes[saga] = { wiki, file: norm(landscape), page: li.descriptionurl, download: scaled(li.url, 1920) };
  else console.log(`sin paisaje: ${saga}`);
}
writeFileSync(root('src/content/art.json'), JSON.stringify(art, null, 2) + '\n');
console.log(`${Object.keys(art.portraits).length} retratos y ${Object.keys(art.landscapes).length} paisajes`);
