export const SITE_TITLE = 'Puzzmo Blog';
export const SITE_DESCRIPTION = 'The blog for puzzmo.com news and updates.';

export const AUTHORS: Record<string, { name: string; bio: string; bsky?: string; puzzmoID?: string; }> = {
	orta: { name: 'Orta Therox', bio: 'Programmer of sorts', bsky: 'orta.io', puzzmoID: 'corta-33r000e1vqygen397fz:user' },
	brooke: { name: 'Brooke Husic', bio: 'Crossword editor of sorts', bsky: 'xandraladee', puzzmoID: 'cldj3irbx05jd1ukd06uydr0q:user' },
	saman: { name: 'Saman Bemel Benrud', bio: 'Game developer', bsky: 'samanbb', puzzmoID: 'clci3pnsa000m1vmhbdjphxez:user' },
	zach: { name: 'Zach Gage', bio: 'Game designer', bsky: 'stfj.net', puzzmoID: 'clccar02b002k1vqye12gd4oc:user' },
	max: { name: 'Max Greenstein', bio: 'Crossword intern',  },
	madeline: { name: 'Madeline Kaplan', bio: 'Assistant puzzle editor' },
	gary: { name: 'Gary Josack', bio: 'Software Person', puzzmoID: 'clonr3jhf1b0y1vng3zx672i5:user' },
};

/** Map a tag name to a CSS class modifier for tag chip color. */
export function tagClass(tag: string | undefined): string {
	if (!tag) return '';
	const t = tag.toLowerCase();
	if (['puzzles', 'crosswords', 'crossword', 'words'].includes(t)) return 'tag-puzzles';
	if (['design', 'art', 'theme', 'themes'].includes(t)) return 'tag-design';
	if (['words', 'editorial'].includes(t)) return 'tag-words';
	if (['meta', 'announcement', 'news'].includes(t)) return 'tag-paper';
	return '';
}
