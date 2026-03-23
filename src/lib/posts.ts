import { getCollection, type CollectionEntry } from 'astro:content';

/** Convert a content collection ID like "2024/10/30/tech-stack/index" to a URL slug "2024/10/30/tech-stack" */
export function postSlug(post: CollectionEntry<'blog'>): string {
	return post.id.replace(/\/index$/, '');
}

/** Get the URL path for a post */
export function postUrl(post: CollectionEntry<'blog'>): string {
	return `/posts/${postSlug(post)}/`;
}

/** Get all published posts sorted by date (newest first) */
export async function getPublishedPosts() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Get all unique tags with their post counts */
export async function getAllTags() {
	const posts = await getPublishedPosts();
	const tagMap = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags ?? []) {
			tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
		}
	}
	return [...tagMap.entries()].sort((a, b) => b[1] - a[1]);
}
