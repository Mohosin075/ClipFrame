import { z } from 'zod'
import {
  ContentLanguage,
  SocialPlatform,
  TargetAudience,
} from './useronboarding.interface'

// Social handles schema
export const SocialHandlesItemSchema = z.object({
  platform: z.nativeEnum(SocialPlatform).optional(),
  username: z.string().optional(),
})

// Brand color schema with hex validation
export const BrandColorSchema = z.array(
  z.object({
    name: z.string(), // e.g., 'primary', 'secondary'
    value: z
      .string()
      .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Invalid hex color'),
  }),
)

// Main onboarding schema
export const UserOnboardingSchema = z.object({
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')
    .optional(),
  businessType: z.string().default('General'),
  customBusinessType: z.string().default(''),
  businessDescription: z.string().default(''),
  targetAudience: z.array(z.nativeEnum(TargetAudience)).default([]),
  contentLanguages: z
    .array(z.nativeEnum(ContentLanguage))
    .default([ContentLanguage.EN]),
  autoTranslateCaptions: z.boolean().default(false),
  socialHandles: z.array(SocialHandlesItemSchema).default([]),
  logo: z.string().url().optional(), // logo URL
  brandColors: z.array(BrandColorSchema).default([]), // array of {name, value}
  deletedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// TypeScript type for input
export type UserOnboardingInput = z.infer<typeof UserOnboardingSchema>
