"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialintegrationServices = void 0;
exports.upsertFacebookPages = upsertFacebookPages;
exports.upsertInstagramAccounts = upsertInstagramAccounts;
exports.upsertTikTokAccounts = upsertTikTokAccounts;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const socialintegration_model_1 = require("./socialintegration.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const socialintegration_constants_1 = require("./socialintegration.constants");
const mongoose_1 = require("mongoose");
const graphAPIHelper_1 = require("../../../helpers/graphAPIHelper");
const tiktokAPIHelper_1 = require("../../../helpers/tiktokAPIHelper");
const user_model_1 = require("../user/user.model");
const createSocialintegration = async (user, payload) => {
    try {
        const result = await socialintegration_model_1.Socialintegration.create(payload);
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Socialintegration, please try again with valid data.');
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
const getAllSocialintegrations = async (user, filterables, pagination) => {
    const token = 'EAATItxj1TL8BPiRg4FnrcZB1k7TviQRqPjUgJynUoGS8AHB3L1Ci6kDR5IvfpKw6D8aS1rovOrx9tEtTg0RZC9AeCIYhQeceCHNPAcIbLxpGHDQS0wZAIwmCVTphNOtLeI6qinxsfXjJ0kJUHnaMRKRKfoZAUJfhaNCbZCGa7wV4mjTMCdkAT3cXwE5747j9vGplIHwMd5yaZAL0fUuHwT929u';
    const id = '823267804193695';
    const fbContainerId = '122111981337022104';
    const igId = '18076592735160188';
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: socialintegration_constants_1.socialintegrationSearchableFields.map(field => ({
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
        socialintegration_model_1.Socialintegration.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder }),
        socialintegration_model_1.Socialintegration.countDocuments(whereConditions),
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
const getSingleSocialintegration = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Socialintegration ID');
    }
    const result = await socialintegration_model_1.Socialintegration.findById(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested socialintegration not found, please try again with valid id');
    }
    return result;
};
const updateSocialintegration = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Socialintegration ID');
    }
    const result = await socialintegration_model_1.Socialintegration.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested socialintegration not found, please try again with valid id');
    }
    return result;
};
const deleteSocialintegration = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Socialintegration ID');
    }
    const result = await socialintegration_model_1.Socialintegration.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Something went wrong while deleting socialintegration, please try again with valid id.');
    }
    return result;
};
async function upsertFacebookPages(accessToken, profile, user) {
    var _a, _b, _c, _d;
    console.log({ accessToken, profile, user });
    // 1️⃣ Pull the list of FB Pages the user manages
    const pages = await (0, graphAPIHelper_1.getFacebookPages)(accessToken);
    console.log({ pages });
    // 2️⃣ Upsert into your Socialintegration collection
    return socialintegration_model_1.Socialintegration.findOneAndUpdate({ appId: profile.id, platform: 'facebook' }, {
        user: user._id,
        platform: 'facebook',
        appId: profile.id,
        accessToken,
        accounts: pages,
        metaProfile: {
            email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
            name: profile.displayName,
            photo: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
        },
    }, { upsert: true, new: true });
}
async function upsertInstagramAccounts(accessToken, profile, user) {
    var _a, _b, _c, _d;
    // 1️⃣ Find IG business/creator accounts tied to this FB user
    const igAccounts = await (0, graphAPIHelper_1.getInstagramAccounts)(accessToken);
    console.log('Found IG Accounts:', igAccounts);
    // 2️⃣ Upsert
    return socialintegration_model_1.Socialintegration.findOneAndUpdate({ appId: profile.id, platform: 'instagram' }, {
        user: user._id,
        platform: 'instagram',
        appId: profile.id,
        accessToken,
        accounts: igAccounts,
        metaProfile: {
            email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
            name: profile.displayName,
            photo: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
        },
    }, { upsert: true, new: true });
}
async function upsertTikTokAccounts(code, userId) {
    const accessToken = await (0, tiktokAPIHelper_1.getTiktokToken)(code);
    // 1️⃣ Get TikTok accounts tied to this accessToken
    const tiktokAccounts = await (0, tiktokAPIHelper_1.getTikTokAccounts)(accessToken);
    console.log('Found TikTok Accounts:', tiktokAccounts);
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found!');
    }
    // 2️⃣ Prepare metaProfile from TikTok account (first account)
    const firstAccount = tiktokAccounts[0] || {};
    const metaProfile = {
        email: '', // TikTok usually does not provide email
        name: firstAccount.username || '',
        photo: firstAccount.profilePicture || '',
    };
    const appId = firstAccount.unionId; // or firstAccount.id
    // 3️⃣ Upsert into Socialintegration
    return socialintegration_model_1.Socialintegration.findOneAndUpdate({ appId, platform: 'tiktok', user: userId }, // query by the same appId
    {
        user: userId,
        platform: 'tiktok',
        appId,
        accessToken,
        accounts: tiktokAccounts,
        metaProfile,
    }, { upsert: true, new: true });
}
exports.SocialintegrationServices = {
    createSocialintegration,
    getAllSocialintegrations,
    getSingleSocialintegration,
    updateSocialintegration,
    deleteSocialintegration,
};
