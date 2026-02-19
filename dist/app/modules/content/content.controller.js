"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const content_service_1 = require("./content.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const content_constants_1 = require("./content.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    const contentData = { ...req.body, user: userId.authId, templateId: id };
    const result = await content_service_1.ContentServices.createContent(req.user, contentData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Content created successfully',
        data: result,
    });
});
const updateContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const contentData = req.body;
    const result = await content_service_1.ContentServices.updateContent(id, contentData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Content updated successfully',
        data: result,
    });
});
const getSingleContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await content_service_1.ContentServices.getSingleContent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Content retrieved successfully',
        data: result,
    });
});
const getAllContents = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, content_constants_1.contentFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await content_service_1.ContentServices.getAllContents(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contents retrieved successfully',
        data: result,
    });
});
const deleteContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    const result = await content_service_1.ContentServices.deleteContent(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Content deleted successfully',
        data: result,
    });
});
const duplicateContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    const result = await content_service_1.ContentServices.duplicateContent(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Content duplicated successfully',
        data: result,
    });
});
const getAllMyContents = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    const filterables = (0, pick_1.default)(req.query, content_constants_1.contentFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await content_service_1.ContentServices.getAllMyContents(userId, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contents retrieved successfully',
        data: result,
    });
});
exports.ContentController = {
    createContent,
    updateContent,
    getSingleContent,
    getAllContents,
    deleteContent,
    duplicateContent,
    getAllMyContents,
};
