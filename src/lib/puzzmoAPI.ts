/**
 * Build-time helpers for hitting the Puzzmo private GraphQL API.
 *
 * Auth: the bearer token is read from the `PUZZMO_API_TOKEN` env var (loaded
 * via `.env.local`). When the env var is missing or a request fails, helpers
 * resolve to `null` so the build still succeeds — pages fall back to the
 * static info in `src/consts.ts`.
 */

export interface PuzzmoUser {
	id: string;
	username: string;
	usernameID: string;
	name: string;
	avatarURL: string;
	blueskyHandle: string | null;
	twitchHandle: string | null;
	followersCount: number;
	followingCount: number;
	publicProfile: {
		id: string;
		highlightedStats: Array<{ msg: string; section: string; slug: string }>;
	} | null;
}

const cache = new Map<string, PuzzmoUser | null>();
const inflight = new Map<string, Promise<PuzzmoUser | null>>();

const QUERY = `query BlogAuthor($userIDOrUsername: ID!) {
  user(id: $userIDOrUsername) {
    id
    username
    usernameID
    name
    avatarURL
    blueskyHandle
    twitchHandle
    followersCount
    followingCount
    publicProfile {
      id
      highlightedStats { msg section slug }
    }
  }
}`;

/** Strip stray prefix junk from a Puzzmo user ID (e.g. accidental emoji/spaces). */
function normaliseUserID(raw: string): string {
	return raw.trim().replace(/^[^a-z0-9]+/i, '');
}

export async function getPuzzmoUser(rawUserID: string | undefined): Promise<PuzzmoUser | null> {
	if (!rawUserID) return null;
	const userID = normaliseUserID(rawUserID);
	if (!userID) return null;

	if (cache.has(userID)) return cache.get(userID) ?? null;
	const pending = inflight.get(userID);
	if (pending) return pending;

	const promise = (async (): Promise<PuzzmoUser | null> => {
		try {
			const res = await fetch('https://api.puzzmo.com/graphql?BlogAuthor', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ~`,
					'auth-provider': 'custom',
					'Origin': 'https://www.puzzmo.com',
					'Referer': 'https://www.puzzmo.com/',
					'runtime': 'web',
				},
				body: JSON.stringify({
					operationName: 'BlogAuthor',
					query: QUERY,
					variables: { userIDOrUsername: userID },
				}),
			});
			if (!res.ok) {
				console.warn(`[puzzmo] ${userID}: ${res.status} ${res.statusText}`);
				cache.set(userID, null);
				return null;
			}
			const json = (await res.json()) as { data?: { user?: PuzzmoUser | null }; errors?: unknown };
			if (json.errors) {
				console.warn(`[puzzmo] ${userID}: graphql errors`, json.errors);
			}
			const user = json.data?.user ?? null;
			cache.set(userID, user);
			return user;
		} catch (err) {
			console.warn(`[puzzmo] ${userID}: fetch error`, err);
			cache.set(userID, null);
			return null;
		}
	})();

	inflight.set(userID, promise);
	try {
		return await promise;
	} finally {
		inflight.delete(userID);
	}
}
