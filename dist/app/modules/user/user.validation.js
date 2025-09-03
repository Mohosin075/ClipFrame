"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidations = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enum/user");
const addressSchema = zod_1.z.object({
    city: zod_1.z.string().optional(),
    permanentAddress: zod_1.z.string().optional(),
    presentAddress: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
});
const createUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }).email(),
        password: zod_1.z.string({ required_error: 'Password is required' }).min(6),
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: addressSchema.optional(),
        role: zod_1.z.enum([user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.TEACHER, user_1.USER_ROLES.STUDENT, user_1.USER_ROLES.GUEST], {
            message: 'Role must be one of admin, teacher, student, guest',
        }),
    }),
});
const updateUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: addressSchema.optional(),
        image: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
const updateUserStatusZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.INACTIVE, user_1.USER_STATUS.DELETED], {
            required_error: 'Status is required',
            invalid_type_error: 'Status must be a valid enum value',
        }),
    }),
});
exports.UserValidations = { createUserZodSchema, updateUserZodSchema, updateUserStatusZodSchema };
