"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const passport_auth_controller_1 = require("./passport.auth/passport.auth.controller");
const custom_auth_controller_1 = require("./custom.auth/custom.auth.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const user_1 = require("../../../enum/user");
const auth_1 = __importStar(require("../../middleware/auth"));
const auth_helper_1 = require("./auth.helper");
const router = express_1.default.Router();
router.post('/signup', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.createUserZodSchema), custom_auth_controller_1.CustomAuthController.createUser);
router.post('/admin-login', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.loginZodSchema), custom_auth_controller_1.CustomAuthController.adminLogin);
router.post('/login', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.loginZodSchema), passport_1.default.authenticate('local', { session: false }), passport_auth_controller_1.PassportAuthController.login);
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false }), passport_auth_controller_1.PassportAuthController.googleAuthCallback);
router.post('/verify-account', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.verifyAccountZodSchema), custom_auth_controller_1.CustomAuthController.verifyAccount);
router.post('/custom-login', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.loginZodSchema), custom_auth_controller_1.CustomAuthController.customLogin);
router.post('/forget-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.forgetPasswordZodSchema), custom_auth_controller_1.CustomAuthController.forgetPassword);
router.post('/reset-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.resetPasswordZodSchema), custom_auth_controller_1.CustomAuthController.resetPassword);
router.post('/resend-otp', (0, auth_1.tempAuth)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STUDENT, user_1.USER_ROLES.GUEST, user_1.USER_ROLES.TEACHER), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.resendOtpZodSchema), custom_auth_controller_1.CustomAuthController.resendOtp);
router.post('/change-password', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STUDENT, user_1.USER_ROLES.GUEST), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.changePasswordZodSchema), custom_auth_controller_1.CustomAuthController.changePassword);
router.delete('/delete-account', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STUDENT, user_1.USER_ROLES.GUEST), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.deleteAccount), custom_auth_controller_1.CustomAuthController.deleteAccount);
router.post('/refresh-token', custom_auth_controller_1.CustomAuthController.getRefreshToken);
router.post('/social-login', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.socialLoginZodSchema), custom_auth_controller_1.CustomAuthController.socialLogin);
// Initiate Facebook authentication
router.get('/facebook', passport_1.default.authenticate('facebook', {
    scope: ['email', 'public_profile'],
}));
// Facebook callback handler
router.get('/facebook/callback', passport_1.default.authenticate('facebook', { session: false }), (req, res, next) => {
    console.log("hit");
    const user = req.user;
    const token = auth_helper_1.AuthHelper.createToken(user.authId, user.role);
    console.log({ token });
    res.status(200).json({
        token,
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    });
});
exports.AuthRoutes = router;
