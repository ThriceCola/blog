import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.optional(image()),
      heroImagePosition: z.string().optional().default('center'),
      cardImage: z.optional(image()),
      cardImagePosition: z.string().optional().default('center'),
    }),
});

const thoughts = defineCollection({
  loader: glob({ base: './src/content/thoughts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    content: z.string().optional(),
    pubDate: z.preprocess((arg) => {
      if (typeof arg === 'string') {
        // 将 "2026-07-11 10:00:00" / "2026-07-11 10:00" 转为标准 ISO 格式
        return arg.replace(' ', 'T');
      }
      return arg;
    }, z.coerce.date()),
  }),
});

export const collections = { blog, thoughts };
