import { z } from 'zod'

export const CategoryValidations = {
  create: z.object({
    body: z.object({
      name: z.string(),
      description: z.string().optional(),
      image: z.string().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
    }),
  }),
}
