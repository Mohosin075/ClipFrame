"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContenttemplateServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const contenttemplate_constants_1 = require("./contenttemplate.constants");
const mongoose_1 = require("mongoose");
const contenttemplate_model_1 = require("./contenttemplate.model");
const createContentTemplate = async (user, payload) => {
    try {
        console.log({ payload });
        const result = await contenttemplate_model_1.ContentTemplate.create({
            ...payload,
            createdBy: user.authId,
        });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create ContentTemplate, please try again with valid data.');
        }
        return result;
    }
    catch (error) {
        if (error.code === 11000) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Duplicate entry found');
        }
        throw error;
    }
};
const getAllContentTemplates = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: contenttemplate_constants_1.contenttemplateSearchableFields.map(field => ({
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
        contenttemplate_model_1.ContentTemplate.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate({
            path: 'createdBy',
            select: 'email profile name',
        }),
        contenttemplate_model_1.ContentTemplate.countDocuments(whereConditions),
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
const getSingleContentTemplate = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid ContentTemplate ID');
    }
    const result = await contenttemplate_model_1.ContentTemplate.findById(id).populate('createdBy');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested contenttemplate not found, please try again with valid id');
    }
    return result;
};
const updateContentTemplate = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid ContentTemplate ID');
    }
    const result = await contenttemplate_model_1.ContentTemplate.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    }).populate('createdBy');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested contenttemplate not found, please try again with valid id');
    }
    return result;
};
const deleteContentTemplate = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid ContentTemplate ID');
    }
    const result = await contenttemplate_model_1.ContentTemplate.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting contenttemplate, please try again with valid id.');
    }
    return result;
};
const toggleTemplateLove = async (templateId, userId) => {
    const template = await contenttemplate_model_1.ContentTemplate.findById(templateId);
    if (!template) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Content template not found.');
    }
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const alreadyLoved = template.stats.lovedBy
        .map(id => id.toString())
        .includes(userId.toString());
    const updateQuery = alreadyLoved
        ? {
            $pull: { 'stats.lovedBy': userObjectId },
            $inc: { 'stats.loveCount': -1 },
        }
        : {
            $addToSet: { 'stats.lovedBy': userObjectId },
            $inc: { 'stats.loveCount': 1 },
        };
    const updatedTemplate = await contenttemplate_model_1.ContentTemplate.findByIdAndUpdate(templateId, updateQuery, { new: true });
    return updatedTemplate;
};
const getRecentTemplates = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: contenttemplate_constants_1.contenttemplateSearchableFields.map(field => ({
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
        contenttemplate_model_1.ContentTemplate.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate({
            path: 'createdBy',
            select: 'email profile name',
        }),
        contenttemplate_model_1.ContentTemplate.countDocuments(whereConditions),
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
exports.ContenttemplateServices = {
    createContentTemplate,
    getAllContentTemplates,
    getSingleContentTemplate,
    updateContentTemplate,
    deleteContentTemplate,
    toggleTemplateLove,
    getRecentTemplates,
};
