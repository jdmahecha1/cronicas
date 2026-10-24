// Genera public/og.png (1200×630), la imagen que se ve al compartir el enlace.
// Uso: npm run og  (requiere el navegador de Playwright: npx playwright install chromium)
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const dir = new URL('../src/content/sagas/', import.meta.url);
const sagas = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')));

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;
    padding:0 90px;box-sizing:border-box;font-family:Georgia,serif;color:#ece8df;
    background:radial-gradient(900px 500px at 85% 0%,rgba(217,165,74,.28),transparent 70%),#0c0e13}
  .eyebrow{font:600 22px system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#e8c483}
  h1{font-size:84px;line-height:1.02;margin:18px 0 22px;font-weight:600}
  em{color:#e8c483;font-weight:400}
  .sagas{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
  .sagas span{font:500 21px system-ui,sans-serif;padding:8px 18px;border-radius:999px;border:2px solid;}
</style></head><body>
  <div class="eyebrow">Crónicas · historias de videojuegos</div>
  <h1>Toda la historia.<br><em>Sin spoilers.</em></h1>
  <div class="sagas">${sagas.map((s) => `<span style="border-color:${s.accent};color:${s.accent}">${s.title}</span>`).join('')}</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: fileURLToPath(new URL('../public/og.png', import.meta.url)) });
await browser.close();
console.log('public/og.png generado');
