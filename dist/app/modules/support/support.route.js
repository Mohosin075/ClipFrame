"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const support_controller_1 = require("./support.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const support_validation_1 = require("./support.validation");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), support_controller_1.SupportController.getAllSupports);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), support_controller_1.SupportController.getSingleSupport);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.STUDENT, user_1.USER_ROLES.TEACHER, user_1.USER_ROLES.GUEST), (0, validateRequest_1.default)(support_validation_1.createSupportSchema), support_controller_1.SupportController.createSupport);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(support_validation_1.updateSupportSchema), support_controller_1.SupportController.updateSupport);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), support_controller_1.SupportController.deleteSupport);
exports.SupportRoutes = router;
