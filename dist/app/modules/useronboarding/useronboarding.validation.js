"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOnboardingSchema = exports.BrandColorSchema = exports.SocialHandlesItemSchema = void 0;
const zod_1 = require("zod");
const useronboarding_interface_1 = require("./useronboarding.interface");
// Social handles schema
exports.SocialHandlesItemSchema = zod_1.z.object({
    platform: zod_1.z.nativeEnum(useronboarding_interface_1.SocialPlatform).optional(),
    username: zod_1.z.string().optional(),
});
// Brand color schema with hex validation
exports.BrandColorSchema = zod_1.z.array(zod_1.z.object({
    name: zod_1.z.string(), // e.g., 'primary', 'secondary'
    value: zod_1.z
        .string()
        .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Invalid hex color'),
}));
// Main onboarding schema
exports.UserOnboardingSchema = zod_1.z.object({
    userId: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')
        .optional(),
    businessType: zod_1.z.string().default('General'),
    customBusinessType: zod_1.z.string().default(''),
    businessDescription: zod_1.z.string().default(''),
    targetAudience: zod_1.z.array(zod_1.z.nativeEnum(useronboarding_interface_1.TargetAudience)).default([]),
    contentLanguages: zod_1.z
        .array(zod_1.z.nativeEnum(useronboarding_interface_1.ContentLanguage))
        .default([useronboarding_interface_1.ContentLanguage.EN]),
    autoTranslateCaptions: zod_1.z.boolean().default(false),
    socialHandles: zod_1.z.array(exports.SocialHandlesItemSchema).default([]),
    logo: zod_1.z.string().url().default(''), // logo URL
    brandColors: zod_1.z.array(exports.BrandColorSchema).default([]), // array of {name, value}
    deletedAt: zod_1.z.date().nullable().optional(),
    createdAt: zod_1.z.date().optional(),
    updatedAt: zod_1.z.date().optional(),
});
