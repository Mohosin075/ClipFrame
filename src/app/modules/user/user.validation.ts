import { z } from 'zod'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import { Membership } from './user.interface'

// ------------------ SUB-SCHEMAS ------------------
const addressSchema = z.object({
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  permanentAddress: z.string().optional(),
  presentAddress: z.string().optional(),
})

const authenticationSchema = z.object({
  restrictionLeftAt: z.date().nullable().optional(),
  resetPassword: z.boolean().default(false),
  wrongLoginAttempts: z.number().default(0),
  passwordChangedAt: z.date().optional(),
  oneTimeCode: z.string().optional(),
  latestRequestAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional(),
  requestCount: z.number().default(0),
  authType: z.enum(['createAccount', 'resetPassword']).optional(),
})

const pointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z
    .tuple([z.number(), z.number()]) // [longitude, latitude]
    .default([0, 0]),
})

// ------------------ MAIN USER VALIDATION ------------------
export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    profile: z.string().url('Profile must be a valid URL').optional(),
    businessName: z.string().optional(),
    businessCategory: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    preferredLanguages: z.array(z.string()).optional(),
    timezone: z.string().optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),

    membership: z.nativeEnum(Membership).default(Membership.BASIC),

    status: z.nativeEnum(USER_STATUS).default(USER_STATUS.ACTIVE),
    verified: z.boolean().default(false),

    address: addressSchema.optional(),
    location: pointSchema.default({ type: 'Point', coordinates: [0, 0] }),

    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.nativeEnum(USER_ROLES).default(USER_ROLES.USER),
    appId: z.string().optional(),
    deviceToken: z.string().optional(),

    authentication: authenticationSchema.optional(),
  }),
})

// ------------------ UPDATE USER VALIDATION ------------------
export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    profile: z.string().url().optional(),
    businessName: z.string().optional(),
    businessCategory: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    preferredLanguages: z.array(z.string()).optional(),
    timezone: z.string().optional(),
    phone: z.string().optional(),
    membership: z.nativeEnum(Membership).optional(),
    status: z.nativeEnum(USER_STATUS).optional(),
    verified: z.boolean().optional(),
    address: addressSchema.optional(),
    location: pointSchema.optional(),
    password: z.string().min(6).optional(),
    role: z.nativeEnum(USER_ROLES).optional(),
    appId: z.string().optional(),
    deviceToken: z.string().optional(),
    authentication: authenticationSchema.optional(),
  }),
})
