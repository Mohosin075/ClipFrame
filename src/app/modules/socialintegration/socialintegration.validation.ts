import { z } from 'zod';

export const SocialintegrationValidations = {
  create: z.object({
    platform: z.string(),
    accountId: z.string(),
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  }),

  update: z.object({
    platform: z.string().optional(),
    accountId: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
};
