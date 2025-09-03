"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const user_model_1 = require("../../../user/user.model");
const passport_local_1 = require("passport-local");
const user_1 = require("../../../../../enum/user");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const FacebookStrategy = require('passport-facebook').Strategy;
const config_1 = __importDefault(require("../../../../../config"));
const ApiError_1 = __importDefault(require("../../../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
}, async (req, email, password, done) => {
    try {
        const isUserExist = await user_model_1.User.findOne({
            email,
            status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.INACTIVE] },
        })
            .select('+password +authentication')
            .lean();
        if (!isUserExist) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No account found with this email, please try with valid email or create an account.');
        }
        return done(null, {
            ...isUserExist,
        });
    }
    catch (err) {
        return done(err);
    }
}));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: config_1.default.google.client_id,
    clientSecret: config_1.default.google.client_secret,
    callbackURL: config_1.default.google.callback_url,
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    req.body.profile = profile;
    req.body.role = user_1.USER_ROLES.STUDENT;
    try {
        return done(null, req.body);
    }
    catch (err) {
        return done(err);
    }
}));
passport_1.default.use(new FacebookStrategy({
    clientID: config_1.default.facebook.app_id,
    clientSecret: config_1.default.facebook.app_secret,
    callbackURL: config_1.default.facebook.callback_url,
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    passReqToCallback: true,
}, async (accessToken, refreshToken, profile, done) => {
    var _a, _b, _c, _d;
    try {
        // Find or create user
        let user = await user_model_1.User.findOne({ appId: profile.id });
        if (!user) {
            user = new user_model_1.User({
                appId: profile.id,
                email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                name: profile.displayName,
                profilePhoto: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
            await user.save();
        }
        else {
            // Update access token if user exists
            await user.save();
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, null);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await user_model_1.User.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
