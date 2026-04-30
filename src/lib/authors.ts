import { AUTHORS } from '../consts';
import { getPuzzmoUser, type PuzzmoUser } from './puzzmoAPI';

export interface EnrichedAuthor {
	slug: string;
	name: string;
	bio: string;
	bsky?: string;
	twitch?: string;
	avatarURL?: string;
	blueskyURL?: string;
	followersCount?: number;
	followingCount?: number;
	highlightedStats?: NonNullable<PuzzmoUser['publicProfile']>['highlightedStats'];
}

const memo = new Map<string, Promise<EnrichedAuthor>>();

export function getAuthor(slug: string): Promise<EnrichedAuthor> {
	const existing = memo.get(slug);
	if (existing) return existing;
	const local = AUTHORS[slug] ?? { name: slug, bio: '' };
	const promise = (async (): Promise<EnrichedAuthor> => {
		const apiUser = await getPuzzmoUser(local.puzzmoID);
		const bsky = local.bsky ?? apiUser?.blueskyHandle ?? undefined;
		return {
			slug,
			name: local.name || apiUser?.name || slug,
			bio: local.bio,
			bsky,
			twitch: apiUser?.twitchHandle ?? undefined,
			avatarURL: apiUser?.avatarURL,
			blueskyURL: bsky ? `https://bsky.app/profile/${bsky}` : undefined,
			followersCount: apiUser?.followersCount,
			followingCount: apiUser?.followingCount,
			highlightedStats: apiUser?.publicProfile?.highlightedStats,
		};
	})();
	memo.set(slug, promise);
	return promise;
}

export async function getAuthors(slugs: string[] | undefined): Promise<EnrichedAuthor[]> {
	if (!slugs?.length) return [];
	return Promise.all(slugs.map(getAuthor));
}
