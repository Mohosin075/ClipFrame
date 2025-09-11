import { z } from 'zod'

export const createPlanZodValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    price: z.number({ required_error: 'Price is required' }),

    duration: z.enum(['1 month', '3 months', '6 months', '1 year'], {
      required_error: 'Duration is required',
    }),
    paymentType: z.enum(['Monthly', 'Yearly'], {
      required_error: 'Payment type is required',
    }),

    // Content limits
    limits: z.object({
      reelsPerWeek: z.number().default(0),
      postsPerWeek: z.number().default(0),
      storiesPerWeek: z.number().default(0),
      businessesManageable: z.number().default(1),
    }),

    // Plan status
    status: z.enum(['active', 'Delete']).default('active'),
  }),
})
