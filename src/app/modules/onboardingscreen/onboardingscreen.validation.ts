import { z } from 'zod';

export const createOnboardingSchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string(),
    imageURL: z.string(),
    order: z.number().optional(),
    actionText: z.string().optional(),
    skipEnabled: z.boolean().optional(),
    status: z.enum(['active', 'inactive', 'deleted']).optional(),
  }),
});

export const updateOnboardingSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageURL: z.string().optional(),
    order: z.number().optional(),
    actionText: z.string().optional(),
    skipEnabled: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});
