// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// Los personajes cuya sola existencia es un spoiler no se anuncian en el sitemap.
import { hiddenCharacterPaths } from './scripts/hidden-paths.mjs';

const hidden = hiddenCharacterPaths();

export default defineConfig({
  site: 'https://jdmahecha1.github.io',
  base: '/cronicas',
  trailingSlash: 'always',
  // Política de seguridad de contenido: Astro calcula los hashes de cada script en línea,
  // así que solo se ejecuta el código que genera el propio sitio. GitHub Pages no permite
  // cabeceras propias, por eso va como <meta http-equiv>.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        'upgrade-insecure-requests',
      ],
      // Pagefind busca con WebAssembly.
      scriptDirective: { resources: ["'self'", "'wasm-unsafe-eval'"] },
      // Los colores de cada saga van en atributos style; un estilo no puede ejecutar código.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  integrations: [
    react(),
    sitemap({ filter: (page) => !hidden.some((path) => page.endsWith(path)) }),
  ],
});
