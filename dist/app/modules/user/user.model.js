"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enum/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    status: {
        type: String,
        enum: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.INACTIVE, user_1.USER_STATUS.DELETED],
        default: user_1.USER_STATUS.ACTIVE,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    profile: {
        type: String,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        default: user_1.USER_ROLES.STUDENT,
    },
    address: {
        city: {
            type: String,
        },
        permanentAddress: {
            type: String,
        },
        presentAddress: {
            type: String,
        },
        country: {
            type: String,
        },
        postalCode: {
            type: String,
        },
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
            default: [0.0, 0.0], // [longitude, latitude]
        },
    },
    appId: {
        type: String,
    },
    deviceToken: {
        type: String,
    },
    authentication: {
        _id: false,
        select: false,
        type: {
            restrictionLeftAt: {
                type: Date,
                default: null,
            },
            resetPassword: {
                type: Boolean,
                default: false,
            },
            wrongLoginAttempts: {
                type: Number,
                default: 0,
            },
            passwordChangedAt: {
                type: Date,
                default: null,
            },
            oneTimeCode: {
                type: String,
                default: null,
            },
            latestRequestAt: {
                type: Date,
                default: null,
            },
            expiresAt: {
                type: Date,
                default: null,
            },
            requestCount: {
                type: Number,
                default: 0,
            },
            authType: {
                type: String,
                default: null,
            },
        },
    },
}, {
    timestamps: true,
});
userSchema.index({ location: '2dsphere' });
userSchema.statics.isPasswordMatched = async function (givenPassword, savedPassword) {
    return await bcrypt_1.default.compare(givenPassword, savedPassword);
};
userSchema.pre('save', async function (next) {
    //find the user by email
    const isExist = await exports.User.findOne({
        email: this.email,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.INACTIVE] },
    });
    if (isExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'An account with this email already exists');
    }
    this.password = await bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
    next();
});
exports.User = (0, mongoose_1.model)('User', userSchema);
