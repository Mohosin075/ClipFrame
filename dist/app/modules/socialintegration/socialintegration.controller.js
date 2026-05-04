"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialintegrationController = void 0;
const socialintegration_service_1 = require("./socialintegration.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const socialintegration_constants_1 = require("./socialintegration.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createSocialintegration = (0, catchAsync_1.default)(async (req, res) => {
    const socialintegrationData = req.body;
    const result = await socialintegration_service_1.SocialintegrationServices.createSocialintegration(req.user, socialintegrationData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Socialintegration created successfully',
        data: result,
    });
});
const updateSocialintegration = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const socialintegrationData = req.body;
    const result = await socialintegration_service_1.SocialintegrationServices.updateSocialintegration(id, socialintegrationData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Socialintegration updated successfully',
        data: result,
    });
});
const getSingleSocialintegration = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await socialintegration_service_1.SocialintegrationServices.getSingleSocialintegration(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Socialintegration retrieved successfully',
        data: result,
    });
});
const getAllSocialintegrations = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, socialintegration_constants_1.socialintegrationFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await socialintegration_service_1.SocialintegrationServices.getAllSocialintegrations(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Socialintegrations retrieved successfully',
        data: result,
    });
});
const deleteSocialintegration = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await socialintegration_service_1.SocialintegrationServices.deleteSocialintegration(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Socialintegration deleted successfully',
        data: result,
    });
});
exports.SocialintegrationController = {
    createSocialintegration,
    updateSocialintegration,
    getSingleSocialintegration,
    getAllSocialintegrations,
    deleteSocialintegration,
};
