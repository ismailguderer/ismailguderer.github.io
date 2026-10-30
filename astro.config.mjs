// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// BIO-ASSIST source: a clone next to this repo, or BIO_ASSIST_DIR (set by the deploy workflow)
const bioAssist = process.env.BIO_ASSIST_DIR ?? fileURLToPath(new URL('../bio-assist', import.meta.url));
if (!existsSync(resolve(bioAssist, 'src/lib.js'))) {
  throw new Error(`BIO-ASSIST source not found at ${bioAssist}. Clone github.com/ismailguderer/bio-assist next to this repo, or set BIO_ASSIST_DIR.`);
}

// user site served from the domain root, so no `base` is needed
export default defineConfig({
  site: 'https://ismailguderer.github.io',
  // unminified HTML keeps view-source readable
  compressHTML: false,
  integrations: [react(), sitemap()],
  vite: {
    resolve: {
      alias: { '@bio-assist': resolve(bioAssist, 'src') },
      // one React copy, even when the BIO-ASSIST clone has its own node_modules
      dedupe: ['react', 'react-dom'],
    },
    server: { fs: { allow: ['.', bioAssist] } },
  },
});
