"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryValidations = void 0;
const zod_1 = require("zod");
exports.CategoryValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            image: zod_1.z.string().optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            image: zod_1.z.string().optional(),
        }),
    }),
};
