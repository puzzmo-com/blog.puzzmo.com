import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			authors: z.array(z.string()).optional(),
			tags: z.array(z.string()).optional(),
			theme: z.string().optional(),
			series: z.array(z.string()).optional(),
			comments: z.boolean().optional(),
			draft: z.boolean().optional(),
		}),
});

export const collections = { blog };
