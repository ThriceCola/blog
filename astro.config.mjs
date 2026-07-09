// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';
import rehypeLqipImages from './src/plugins/rehype-lqip-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.thricecola.com',
  integrations: [mdx(), sitemap(), vue()],
  markdown: {
    rehypePlugins: [rehypeLqipImages],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
});
