"use strict";
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
const auth_1 = __importDefault(require("../../middleware/auth"));
const checkSubscription_1 = require("../subscription/checkSubscription");
const config_1 = __importDefault(require("../../../config"));
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
router.post('/resend-otp', 
// tempAuth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
(0, validateRequest_1.default)(auth_validation_1.AuthValidations.resendOtpZodSchema), custom_auth_controller_1.CustomAuthController.resendOtp);
router.post('/change-password', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.changePasswordZodSchema), custom_auth_controller_1.CustomAuthController.changePassword);
router.delete('/delete-account', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.deleteAccount), custom_auth_controller_1.CustomAuthController.deleteAccount);
router.post('/refresh-token', custom_auth_controller_1.CustomAuthController.getRefreshToken);
router.post('/social-login', (0, validateRequest_1.default)(auth_validation_1.AuthValidations.socialLoginZodSchema), custom_auth_controller_1.CustomAuthController.socialLogin);
router.post('/logout', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), custom_auth_controller_1.CustomAuthController.logout);
// -------------------- Facebook Login Routes --------------------
// 👉 Connect Facebook only
router.get('/facebook', 
// auth(USER_ROLES.ADMIN, USER_ROLES.USER),
async (req, res, next) => {
    const user = req.user;
    // check how many business connected
    // if (user) {
    //   await checkBusinessManage(user)
    // }
    // flag the flow
    req.session.connectType = 'facebook';
    next();
}, passport_1.default.authenticate('facebook', {
    scope: [
        'email',
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'pages_read_user_content',
        'pages_manage_posts',
        'pages_manage_metadata',
        'pages_manage_engagement',
        'business_management',
    ],
}));
router.post('/facebook/token', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.socialTokenZodSchema), custom_auth_controller_1.CustomAuthController.connectFacebookWithToken);
// 👉 Connect Instagram (uses FB login w/ IG scopes)
router.get('/instagram', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), async (req, res, next) => {
    const user = req.user;
    // check how many business connected
    if (user) {
        await (0, checkSubscription_1.checkBusinessManage)(user);
    }
    req.session.connectType = 'instagram';
    next();
}, passport_1.default.authenticate('facebook', {
    scope: [
        'email',
        'public_profile',
        'pages_show_list',
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_insights',
        'instagram_manage_comments',
        'business_management',
        'read_insights',
    ],
}));
router.post('/instagram/token', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(auth_validation_1.AuthValidations.socialTokenZodSchema), custom_auth_controller_1.CustomAuthController.connectInstagramWithToken);
// for tiktok
// routes/social.routes.ts
router.get('/tiktok', async (req, res) => {
    console.log('hitting tiktok');
    const clientKey = config_1.default.tikok.client_id;
    const redirectUri = 'https://mohosin5001.binarybards.online/tiktok/callback';
    const scopes = 'user.info.basic,video.upload,video.publish';
    const state = '68b1fd9e3a485a0f4fc4b527';
    // https://www.tiktok.com/v2/auth/authorize?client_key=sbaw91u1ke2gdjjxhi&scope=user.info.basic,video.upload&response_type=code&redirect_uri=https://mohosin5001.binarybards.online/tiktok/callback&state=68b1fd9e3a485a0f4fc4b527
    const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scopes}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;
    res.redirect(url);
    // res.json({ url })
});
exports.AuthRoutes = router;
