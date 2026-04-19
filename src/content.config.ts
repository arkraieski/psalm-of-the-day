import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const psalmSchema = z.object({
  number: z.number().int().min(1).max(150),
  title: z.string().nullable(),
  testament: z.enum(['OT']),
});

const psalms = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/psalms' }),
  schema: psalmSchema,
});

const psalmsKjv = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/psalms-kjv' }),
  schema: psalmSchema,
});

const psalmsEs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/psalms-es' }),
  schema: psalmSchema,
});

const psalmsIt = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/psalms-it' }),
  schema: psalmSchema,
});

const psalmsPl = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/psalms-pl' }),
  schema: psalmSchema,
});

const psalmsPt = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/psalms-pt' }),
  schema: psalmSchema,
});

const psalmsZh = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/psalms-zh' }),
  schema: psalmSchema,
});

export const collections = { psalms, psalmsKjv, psalmsEs, psalmsIt, psalmsPl, psalmsPt, psalmsZh };
