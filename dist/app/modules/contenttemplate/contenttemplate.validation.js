"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContenttemplateValidations = void 0;
const zod_1 = require("zod");
const stepsItemSchema = zod_1.z.object({
    title: zod_1.z.string(),
    mainTip: zod_1.z.string(),
    detailedTips: zod_1.z.string().optional(),
    mediaType: zod_1.z.string(),
    shotType: zod_1.z.string(),
    duration: zod_1.z.string().optional(),
});
exports.ContenttemplateValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            type: zod_1.z.string(),
            category: zod_1.z.string().optional(),
            thumbnail: zod_1.z.string().optional(),
            previewUrl: zod_1.z.string().optional(),
            steps: zod_1.z.array(stepsItemSchema),
            hashtags: zod_1.z.array(zod_1.z.string()),
            isActive: zod_1.z.boolean().optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            type: zod_1.z.string().optional(),
            category: zod_1.z.string().optional(),
            thumbnail: zod_1.z.string().optional(),
            previewUrl: zod_1.z.string().optional(),
            steps: zod_1.z.array(stepsItemSchema).optional(),
            hashtags: zod_1.z.array(zod_1.z.string()).optional(),
            isActive: zod_1.z.boolean().optional(),
        }),
    }),
};
