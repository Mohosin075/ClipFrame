"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = exports.getProfile = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("./user.model");
const user_1 = require("../../../enum/user");
const logger_1 = require("../../../shared/logger");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const s3helper_1 = require("../../../helpers/image/s3helper");
const useronboarding_model_1 = require("../useronboarding/useronboarding.model");
const config_1 = __importDefault(require("../../../config"));
const subscription_model_1 = require("../subscription/subscription.model");
const updateProfile = async (user, payload) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: user.authId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    if (isUserExist.profile) {
        const url = new URL(isUserExist.profile);
        const key = url.pathname.substring(1);
        await s3helper_1.S3Helper.deleteFromS3(key);
    }
    const updatedProfile = await user_model_1.User.findOneAndUpdate({ _id: user.authId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, {
        $set: payload,
    }, { new: true });
    if (!updatedProfile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update profile.');
    }
    return 'Profile updated successfully.';
};
const createAdmin = async () => {
    const admin = {
        email: config_1.default.super_admin.email,
        name: config_1.default.super_admin.name,
        password: config_1.default.super_admin.password,
        role: user_1.USER_ROLES.ADMIN,
        status: user_1.USER_STATUS.ACTIVE,
        verified: true,
        authentication: {
            oneTimeCode: null,
            restrictionLeftAt: null,
            expiresAt: null,
            latestRequestAt: new Date(),
            authType: '',
        },
    };
    const isAdminExist = await user_model_1.User.findOne({
        email: admin.email,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (isAdminExist) {
        logger_1.logger.log('info', 'Admin account already exist, skipping creation.🦥');
        return isAdminExist;
    }
    const result = await user_model_1.User.create([admin]);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create admin');
    }
    return result[0];
};
const getAllUsers = async (paginationOptions) => {
    console.log('iiiii');
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const [result, total] = await Promise.all([
        user_model_1.User.find({ status: { $nin: [user_1.USER_STATUS.DELETED] } })
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .select('-password -authentication')
            .exec(),
        user_model_1.User.countDocuments({ status: { $nin: [user_1.USER_STATUS.DELETED] } }),
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
const deleteUser = async (userId) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const deletedUser = await user_model_1.User.findOneAndUpdate({ _id: userId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, { $set: { status: user_1.USER_STATUS.DELETED } }, { new: true });
    if (!deletedUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete user.');
    }
    return 'User deleted successfully.';
};
const deleteProfile = async (userId, password) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    }).select('+password');
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const isPasswordMatched = await user_model_1.User.isPasswordMatched(password, isUserExist.password);
    if (!isPasswordMatched) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Password is incorrect.');
    }
    const deletedUser = await user_model_1.User.findOneAndUpdate({ _id: userId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, { $set: { status: user_1.USER_STATUS.DELETED } }, { new: true });
    if (!deletedUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete user.');
    }
    return 'User deleted successfully.';
};
const getUserById = async (userId) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    }).select('-password -authentication');
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const user = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    return user;
};
const updateUserStatus = async (userId, status) => {
    const isUserExist = await user_model_1.User.findOne({
        _id: userId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const updatedUser = await user_model_1.User.findOneAndUpdate({ _id: userId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, { $set: { status } }, { new: true });
    if (!updatedUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update user status.');
    }
    return 'User status updated successfully.';
};
const getProfile = async (user) => {
    var _a, _b, _c, _d, _e, _f;
    // --- Fetch user ---
    const isUserExist = await user_model_1.User.findOne({
        _id: user.authId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    }).select('-authentication -password -location -__v');
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    // --- Fetch onboarding + subscription ---
    const [isOnboarded, subscriber] = await Promise.all([
        useronboarding_model_1.Useronboarding.findOne({ userId: user.authId }),
        subscription_model_1.Subscription.findOne({
            status: 'active',
            user: user.authId,
        })
            .populate({
            path: 'plan',
            select: 'name price features duration title',
        })
            .lean()
            .exec(),
    ]);
    // --- Extract onboarding details ---
    const socialPlatforms = (_b = (_a = isOnboarded === null || isOnboarded === void 0 ? void 0 : isOnboarded.socialHandles) === null || _a === void 0 ? void 0 : _a.map(s => s === null || s === void 0 ? void 0 : s.platform)) !== null && _b !== void 0 ? _b : [];
    // --- Build profile response ---
    return {
        ...isUserExist.toObject(),
        platforms: socialPlatforms,
        membership: (_d = (_c = subscriber === null || subscriber === void 0 ? void 0 : subscriber.plan) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : '',
        preferredLanguages: (_e = isOnboarded === null || isOnboarded === void 0 ? void 0 : isOnboarded.preferredLanguages) !== null && _e !== void 0 ? _e : [],
        businessType: (_f = isOnboarded === null || isOnboarded === void 0 ? void 0 : isOnboarded.businessType) !== null && _f !== void 0 ? _f : 'General',
        businessDescription: isOnboarded === null || isOnboarded === void 0 ? void 0 : isOnboarded.businessDescription,
    };
};
exports.getProfile = getProfile;
exports.UserServices = {
    updateProfile,
    createAdmin,
    getAllUsers,
    deleteUser,
    getUserById,
    updateUserStatus,
    getProfile: exports.getProfile,
    deleteProfile,
};
