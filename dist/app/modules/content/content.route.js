"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const content_controller_1 = require("./content.controller");
const content_validation_1 = require("./content.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const fileUploadHandler_1 = __importDefault(require("../../middleware/fileUploadHandler"));
const mediaUpload_1 = require("./mediaUpload");
const router = express_1.default.Router();
// /api/v1/content/
router
    .route('/')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.CREATOR), content_controller_1.ContentController.getAllContents);
router
    .route('/create/:id')
    .post((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.CREATOR), (0, fileUploadHandler_1.default)(), mediaUpload_1.handleMediaUpload, (0, validateRequest_1.default)(content_validation_1.ContentValidations.create), content_controller_1.ContentController.createContent);
// /api/v1/content/my-contents
router
    .route('/my-contents')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.CREATOR), content_controller_1.ContentController.getAllMyContents);
// /api/v1/content/:id
router
    .route('/:id')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.CREATOR), content_controller_1.ContentController.getSingleContent)
    .patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.CREATOR), (0, validateRequest_1.default)(content_validation_1.ContentValidations.update), content_controller_1.ContentController.updateContent)
    .delete((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.CREATOR), content_controller_1.ContentController.deleteContent);
// /api/v1/content/duplicate/:id
router
    .route('/duplicate/:id')
    .post((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.CREATOR), content_controller_1.ContentController.duplicateContent);
exports.ContentRoutes = router;
