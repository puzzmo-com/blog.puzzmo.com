/**
 * Astro integration that serves and ships assets co-located with blog posts.
 *
 * Hugo (the predecessor) served every file in a post's directory at the
 * post's URL, so authors could write `<img src="GAMEPLAY_GIF.gif" />` and
 * have it just work. Astro's content-collections pipeline only processes
 * images referenced via markdown image syntax — raw HTML `<img>` is left
 * untouched and the source dir is not publicly served.
 *
 * This integration restores the Hugo behaviour:
 *   /posts/<slug>/<file>.<ext>  →  src/content/blog/<slug>/<file>.<ext>
 *
 * Dev: a Connect middleware streams the file from disk on demand.
 * Build: every non-markdown file in src/content/blog is copied into dist/posts.
 */

import { promises as fs } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSET_EXTS = new Set([
	'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif',
	'.mp4', '.mov', '.webm',
	'.pdf',
]);

const CONTENT_TYPES = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.avif': 'image/avif',
	'.mp4': 'video/mp4',
	'.mov': 'video/quicktime',
	'.webm': 'video/webm',
	'.pdf': 'application/pdf',
};

/** Walk a directory tree and yield every file path. */
async function* walk(dir) {
	let entries;
	try {
		entries = await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(full);
		} else if (entry.isFile()) {
			yield full;
		}
	}
}

export default function blogAssets() {
	return {
		name: 'puzzmo:blog-assets',
		hooks: {
			'astro:server:setup': ({ server, logger }) => {
				const contentRoot = fileURLToPath(new URL('../src/content/blog/', import.meta.url));
				server.middlewares.use(async (req, res, next) => {
					const url = req.url || '';
					const match = url.match(/^\/posts\/(.+\.[a-z0-9]+)(?:\?.*)?$/i);
					if (!match) return next();
					const ext = extname(match[1]).toLowerCase();
					if (!ASSET_EXTS.has(ext)) return next();
					const filePath = join(contentRoot, decodeURIComponent(match[1]));
					if (!filePath.startsWith(contentRoot)) return next();
					try {
						const data = await fs.readFile(filePath);
						res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream');
						res.setHeader('Cache-Control', 'no-cache');
						res.end(data);
					} catch {
						return next();
					}
				});
				logger.info('Serving co-located post assets from src/content/blog/');
			},

			'astro:build:done': async ({ dir, logger }) => {
				const contentRoot = fileURLToPath(new URL('../src/content/blog/', import.meta.url));
				const outRoot = join(fileURLToPath(dir), 'posts');
				let copied = 0;
				for await (const filePath of walk(contentRoot)) {
					const ext = extname(filePath).toLowerCase();
					if (!ASSET_EXTS.has(ext)) continue;
					const rel = relative(contentRoot, filePath);
					const target = join(outRoot, rel);
					await fs.mkdir(dirname(target), { recursive: true });
					await fs.copyFile(filePath, target);
					copied++;
				}
				logger.info(`Copied ${copied} co-located post asset${copied === 1 ? '' : 's'} into dist/posts/`);
			},
		},
	};
}
