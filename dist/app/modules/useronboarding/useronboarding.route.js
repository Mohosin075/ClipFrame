"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseronboardingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const useronboarding_controller_1 = require("./useronboarding.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const useronboarding_validation_1 = require("./useronboarding.validation");
const fileUploadHandler_1 = __importDefault(require("../../middleware/fileUploadHandler"));
const s3helper_1 = require("../../../helpers/image/s3helper");
const router = express_1.default.Router();
const handleBrandingImageUpload = async (req, res, next) => {
    var _a;
    try {
        const payload = req.body;
        if (payload.brandColors) {
            payload.brandColors = JSON.parse(payload.brandColors || '[]');
            req.body.brandColors = payload.brandColors;
        }
        const imageFiles = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        if (imageFiles) {
            const uploadedImageUrls = await s3helper_1.S3Helper.uploadMultipleFilesToS3(imageFiles, 'image');
            if (uploadedImageUrls.length > 0) {
                req.body.logo = uploadedImageUrls[0];
            }
        }
    }
    catch (error) {
        console.error({ error });
        return res.status(400).json({ message: 'Failed to upload image' });
    }
    next();
};
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), useronboarding_controller_1.UseronboardingController.getAllUseronboardings);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), useronboarding_controller_1.UseronboardingController.getSingleUseronboarding);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STUDENT), (0, validateRequest_1.default)(useronboarding_validation_1.UserOnboardingSchema), useronboarding_controller_1.UseronboardingController.createUseronboarding);
router.post('/branding', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STUDENT), (0, fileUploadHandler_1.default)(), handleBrandingImageUpload, 
// validateRequest(UserOnboardingSchema),
useronboarding_controller_1.UseronboardingController.createUseronboarding);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), useronboarding_controller_1.UseronboardingController.deleteUseronboarding);
exports.UseronboardingRoutes = router;
