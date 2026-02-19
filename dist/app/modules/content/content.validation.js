"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentValidations = exports.clipSchema = void 0;
const zod_1 = require("zod");
const ScheduledAtAny = zod_1.z.object({
    type: zod_1.z.literal('any'),
});
const ScheduledAtSingle = zod_1.z.object({
    type: zod_1.z.literal('single').optional(),
    date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    time: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format'),
});
const ScheduledAtRange = zod_1.z.object({
    type: zod_1.z.literal('range'),
    startTime: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'StartTime must be in HH:mm format'),
    endTime: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'EndTime must be in HH:mm format'),
});
const ScheduledAtSchema = zod_1.z.union([
    ScheduledAtAny,
    ScheduledAtSingle,
    ScheduledAtRange,
]);
exports.clipSchema = zod_1.z.object({
    step: zod_1.z.number().int().nonnegative().optional(),
    url: zod_1.z.string().url({ message: 'Invalid media URL' }),
    duration: zod_1.z.number().positive().optional(),
    type: zod_1.z.enum(['image', 'video'], {
        required_error: 'Clip type is required',
    }),
});
exports.ContentValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            caption: zod_1.z.string(),
            // description: z.string().optional(),
            mediaUrls: zod_1.z.array(zod_1.z.string()),
            contentType: zod_1.z.enum(['post', 'reel', 'story', 'carousel']),
            scheduledAt: ScheduledAtSchema.optional(),
            remindMe: zod_1.z.boolean().optional(),
            platform: zod_1.z.array(zod_1.z.enum(['facebook', 'instagram', 'tiktok'])).optional(),
            clips: zod_1.z.array(exports.clipSchema).optional(),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            caption: zod_1.z.string().optional(),
            // description: z.string().optional(),
            scheduledAt: ScheduledAtSchema.optional(),
        }),
    }),
};
