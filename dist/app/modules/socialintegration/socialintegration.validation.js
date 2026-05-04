"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialintegrationValidations = void 0;
const zod_1 = require("zod");
exports.SocialintegrationValidations = {
    create: zod_1.z.object({
        platform: zod_1.z.string(),
        accountId: zod_1.z.string(),
        accessToken: zod_1.z.string(),
        refreshToken: zod_1.z.string().optional(),
        expiresAt: zod_1.z.string().datetime().optional(),
    }),
    update: zod_1.z.object({
        platform: zod_1.z.string().optional(),
        accountId: zod_1.z.string().optional(),
        accessToken: zod_1.z.string().optional(),
        refreshToken: zod_1.z.string().optional(),
        expiresAt: zod_1.z.string().datetime().optional(),
    }),
};
