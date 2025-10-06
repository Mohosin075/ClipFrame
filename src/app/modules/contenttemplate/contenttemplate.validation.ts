import { z } from 'zod'

const stepsItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  mediaType: z.string(),
  shotType: z.string(),
  duration: z.number().optional(),
})

export const ContenttemplateValidations = {
  create: z.object({
    body: z.object({
      title: z.string(),
      description: z.string().optional(),
      type: z.string(),
      category: z.string().optional(),
      thumbnail: z.string().optional(),
      steps: z.array(stepsItemSchema),
      hashtags: z.array(z.string()),
      isActive: z.boolean().optional(),
      createdBy: z.string(),
    }),
  }),

  update: z.object({
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      type: z.string().optional(),
      category: z.string().optional(),
      thumbnail: z.string().optional(),
      steps: z.array(stepsItemSchema).optional(),
      hashtags: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
      createdBy: z.string().optional(),
    }),
  }),
}
