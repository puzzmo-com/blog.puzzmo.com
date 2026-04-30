// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import blogAssets from './scripts/blog-assets-integration.mjs';

// https://astro.build/config
export default defineConfig({
    site: 'https://blog.puzzmo.com',
    integrations: [mdx(), sitemap(), react(), blogAssets()],
    markdown: {
        shikiConfig: {
            theme: 'github-light',
        },
    },
});