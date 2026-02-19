"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContenttemplateRoutes = void 0;
const express_1 = __importDefault(require("express"));
const contenttemplate_controller_1 = require("./contenttemplate.controller");
const contenttemplate_validation_1 = require("./contenttemplate.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const fileUploadHandler_1 = __importDefault(require("../../middleware/fileUploadHandler"));
const mediaUpload_1 = require("./mediaUpload");
const router = express_1.default.Router();
router
    .route('/recent')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), contenttemplate_controller_1.ContenttemplateController.getRecentTemplates);
// Base route: '/'
router
    .route('/')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), contenttemplate_controller_1.ContenttemplateController.getAllContenttemplates)
    .post((0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, fileUploadHandler_1.default)(), mediaUpload_1.handleMediaUpload, (0, validateRequest_1.default)(contenttemplate_validation_1.ContenttemplateValidations.create), contenttemplate_controller_1.ContenttemplateController.createContenttemplate);
// Route for single content template: '/:id'
router
    .route('/:id')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), contenttemplate_controller_1.ContenttemplateController.getSingleContenttemplate)
    .patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), (0, fileUploadHandler_1.default)(), mediaUpload_1.handleMediaUpload, (0, validateRequest_1.default)(contenttemplate_validation_1.ContenttemplateValidations.update), contenttemplate_controller_1.ContenttemplateController.updateContenttemplate)
    .delete((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), contenttemplate_controller_1.ContenttemplateController.deleteContenttemplate);
// Route for toggle love: '/:id/love'
router.route('/:id/love').patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.CREATOR, user_1.USER_ROLES.USER), contenttemplate_controller_1.ContenttemplateController.toggleTemplateLove);
exports.ContenttemplateRoutes = router;
