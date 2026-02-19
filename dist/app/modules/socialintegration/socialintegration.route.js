"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialintegrationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const socialintegration_controller_1 = require("./socialintegration.controller");
const socialintegration_validation_1 = require("./socialintegration.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), socialintegration_controller_1.SocialintegrationController.getAllSocialintegrations);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), socialintegration_controller_1.SocialintegrationController.getSingleSocialintegration);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(socialintegration_validation_1.SocialintegrationValidations.create), socialintegration_controller_1.SocialintegrationController.createSocialintegration);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(socialintegration_validation_1.SocialintegrationValidations.update), socialintegration_controller_1.SocialintegrationController.updateSocialintegration);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), socialintegration_controller_1.SocialintegrationController.deleteSocialintegration);
exports.SocialintegrationRoutes = router;
