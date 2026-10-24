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
  integrations: [
    react(),
    sitemap({ filter: (page) => !hidden.some((path) => page.endsWith(path)) }),
  ],
});
