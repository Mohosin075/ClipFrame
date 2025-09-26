import { z } from 'zod'

const ScheduledAtAny = z.object({
  type: z.literal('any'),
})

const ScheduledAtSingle = z.object({
  type: z.literal('single').optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format'),
})

const ScheduledAtRange = z.object({
  type: z.literal('range'),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'StartTime must be in HH:mm format',
    ),
  endTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'EndTime must be in HH:mm format',
    ),
})

const ScheduledAtSchema = z.union([
  ScheduledAtAny,
  ScheduledAtSingle,
  ScheduledAtRange,
])

export const clipSchema = z.object({
  step: z.number().int().nonnegative().optional(),
  url: z.string().url({ message: 'Invalid media URL' }),
  duration: z.number().positive().optional(),
  type: z.enum(['image', 'video'], {
    required_error: 'Clip type is required',
  }),
})

export const ContentValidations = {
  create: z.object({
    body: z.object({
      caption: z.string(),
      // description: z.string().optional(),
      mediaUrls: z.array(z.string()),
      contentType: z.enum(['post', 'reels', 'story', 'carousel']),
      scheduledAt: ScheduledAtSchema.optional(),
      remindMe: z.boolean().optional(),
      platform: z.array(z.enum(['facebook', 'instagram', 'tiktok'])).optional(),
      clips: z.array(clipSchema).optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      caption: z.string().optional(),
      // description: z.string().optional(),
      scheduledAt: ScheduledAtSchema.optional(),
    }),
  }),
}
