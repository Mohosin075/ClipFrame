import { z } from 'zod';

export const ContentValidations = {
  create: z.object({
    title: z.string(),
    description: z.string().optional(),
    mediaUrls: z.array(z.string()),
    type: z.string(),
    scheduledAt: z.string().datetime().optional(),
    status: z.string(),
    user: z.string(),
    socialAccounts: z.array(z.string()).optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }),

  update: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    mediaUrls: z.array(z.string()).optional(),
    type: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
    socialAccounts: z.array(z.string()).optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }),
};
