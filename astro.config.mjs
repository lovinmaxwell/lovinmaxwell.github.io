// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lovinmaxwell.github.io',
  
  // If a base path is ever set, the sitemap lists the home page twice, with and without the trailing slash.
  integrations: [sitemap({ filter: (page) => page.endsWith('/') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
