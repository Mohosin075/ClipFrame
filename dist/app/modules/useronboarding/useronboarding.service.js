"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseronboardingServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const useronboarding_constants_1 = require("./useronboarding.constants");
const mongoose_1 = require("mongoose");
const useronboarding_model_1 = require("./useronboarding.model");
const createUseronboarding = async (user, payload) => {
    const data = { ...payload, userId: user.authId };
    try {
        const existing = await useronboarding_model_1.Useronboarding.aggregate([
            { $match: { userId: new mongoose_1.Types.ObjectId(user.authId) } },
            { $limit: 1 },
        ]);
        if (!existing || existing.length === 0) {
            // First time: create new document
            const created = await useronboarding_model_1.Useronboarding.create(data);
            return created;
        }
        const updateFields = {};
        Object.keys(payload).forEach(key => {
            updateFields[key] = payload[key];
        });
        const updated = await useronboarding_model_1.Useronboarding.findOneAndUpdate({ userId: user.authId }, { $set: updateFields }, { new: true }).lean();
        if (!updated) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update onboarding data.');
        }
        return updated;
    }
    catch (error) {
        if (error.code === 11000) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Duplicate entry found');
        }
        throw error;
    }
};
const getAllUseronboardings = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: useronboarding_constants_1.useronboardingSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm,
                    $options: 'i',
                },
            })),
        });
    }
    // Filter functionality
    if (Object.keys(filterData).length) {
        andConditions.push({
            $and: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
            })),
        });
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        useronboarding_model_1.Useronboarding.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('userId'),
        useronboarding_model_1.Useronboarding.countDocuments(whereConditions),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const getSingleUseronboarding = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Useronboarding ID');
    }
    const result = await useronboarding_model_1.Useronboarding.findById(id).populate('userId');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested useronboarding not found, please try again with valid id');
    }
    return result;
};
const deleteUseronboarding = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Useronboarding ID');
    }
    const result = await useronboarding_model_1.Useronboarding.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting useronboarding, please try again with valid id.');
    }
    return result;
};
exports.UseronboardingServices = {
    createUseronboarding,
    getAllUseronboardings,
    getSingleUseronboarding,
    deleteUseronboarding,
};
