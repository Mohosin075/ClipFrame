"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("./category.controller");
const category_validation_1 = require("./category.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const fileUploadHandler_1 = __importDefault(require("../../middleware/fileUploadHandler"));
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const s3helper_1 = require("../../../helpers/image/s3helper");
const router = express_1.default.Router();
router.get('/', category_controller_1.CategoryController.getAllCategorys);
router.get('/:id', category_controller_1.CategoryController.getSingleCategory);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, fileUploadHandler_1.default)(), async (req, res, next) => {
    var _a;
    const payload = req.body;
    try {
        const imageFiles = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        if (imageFiles) {
            // Take the first image only
            const imageFile = imageFiles[0];
            // Upload single image to S3
            const uploadedImageUrl = await s3helper_1.S3Helper.uploadToS3(imageFile, 'image');
            if (!uploadedImageUrl) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to upload image');
            }
            // Merge into req.body for Zod validation
            req.body = {
                image: uploadedImageUrl,
                ...payload,
            };
        }
        next();
    }
    catch (error) {
        console.error({ error });
        res.status(400).json({ message: 'Failed to upload image' });
    }
}, (0, validateRequest_1.default)(category_validation_1.CategoryValidations.create), category_controller_1.CategoryController.createCategory);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, fileUploadHandler_1.default)(), async (req, res, next) => {
    var _a;
    const payload = req.body;
    try {
        const imageFiles = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        if (imageFiles) {
            // Take the first image only
            const imageFile = imageFiles[0];
            // Upload single image to S3
            const uploadedImageUrl = await s3helper_1.S3Helper.uploadToS3(imageFile, 'image');
            if (!uploadedImageUrl) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to upload image');
            }
            // Merge into req.body for Zod validation
            req.body = {
                image: uploadedImageUrl,
                ...payload,
            };
        }
        next();
    }
    catch (error) {
        console.error({ error });
        res.status(400).json({ message: 'Failed to upload image' });
    }
}, (0, validateRequest_1.default)(category_validation_1.CategoryValidations.update), category_controller_1.CategoryController.updateCategory);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), category_controller_1.CategoryController.deleteCategory);
exports.CategoryRoutes = router;
