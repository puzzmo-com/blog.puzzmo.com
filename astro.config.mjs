// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import blogAssets from './scripts/blog-assets-integration.mjs';

// https://astro.build/config
export default defineConfig({
    site: 'https://blog.puzzmo.com',
    // Astro 7 changed the default to 'jsx', which strips the spaces between
    // inline elements our components rely on (e.g. the header nav links)
    compressHTML: true,
    integrations: [mdx(), sitemap(), react(), blogAssets()],
    markdown: {
        shikiConfig: {
            theme: 'github-light',
        },
    },
});