import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const psalms = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/psalms' }),
  schema: z.object({
    number: z.number().int().min(1).max(150),
    title: z.string().nullable(),
    testament: z.enum(['OT']),
  }),
});

export const collections = { psalms };
