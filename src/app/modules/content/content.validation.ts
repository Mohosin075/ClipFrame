import { z } from 'zod'

export const ContentValidations = {
  create: z.object({
    title: z.string(),
    description: z.string().optional(),
    mediaUrls: z.array(z.string()),
    type: z.string(),
    scheduledAt: z
      .object({
        Date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
          .optional(),
        Time: z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Time must be in HH:mm format',
          )
          .optional(),
        // meridiem: z.enum(["AM", "PM"]).optional(), // uncomment if using AM/PM
      })
      .optional(),
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
    scheduledAt: z
      .object({
        Date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
          .optional(),
        Time: z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Time must be in HH:mm format',
          )
          .optional(),
        // meridiem: z.enum(["AM", "PM"]).optional(), // uncomment if using AM/PM
      })
      .optional(),
    status: z.string().optional(),
    user: z.string().optional(),
    socialAccounts: z.array(z.string()).optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }),
}
