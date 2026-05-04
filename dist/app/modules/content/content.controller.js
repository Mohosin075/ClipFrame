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
const pickLocalized_1 = require("../../../shared/pickLocalized");
const content_serializer_1 = require("./content.serializer");
const createContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    const contentData = { ...req.body, user: userId.authId, templateId: id };
    console.log(contentData);
    const result = await content_service_1.ContentServices.createContent(req.user, contentData);
    const locale = (0, pickLocalized_1.getRequestLocale)(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Content created successfully',
        data: (0, content_serializer_1.toPublicContent)(result, locale),
    });
});
const updateContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const contentData = req.body;
    const result = await content_service_1.ContentServices.updateContent(id, contentData);
    const locale = (0, pickLocalized_1.getRequestLocale)(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Content updated successfully',
        data: result ? (0, content_serializer_1.toPublicContent)(result, locale) : result,
    });
});
const getSingleContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await content_service_1.ContentServices.getSingleContent(id);
    const locale = (0, pickLocalized_1.getRequestLocale)(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Content retrieved successfully',
        data: (0, content_serializer_1.toPublicContent)(result, locale),
    });
});
const getAllContents = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, content_constants_1.contentFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await content_service_1.ContentServices.getAllContents(req.user, filterables, pagination);
    const locale = (0, pickLocalized_1.getRequestLocale)(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contents retrieved successfully',
        data: {
            ...result,
            data: result.data.map(doc => (0, content_serializer_1.toPublicContent)(doc, locale)),
        },
    });
});
const deleteContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    const result = await content_service_1.ContentServices.deleteContent(id, userId);
    const locale = (0, pickLocalized_1.getRequestLocale)(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Content deleted successfully',
        data: (0, content_serializer_1.toPublicContent)(result, locale),
    });
});
const duplicateContent = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    const result = await content_service_1.ContentServices.duplicateContent(id, userId);
    const locale = (0, pickLocalized_1.getRequestLocale)(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Content duplicated successfully',
        data: (0, content_serializer_1.toPublicContent)(result, locale),
    });
});
const getAllMyContents = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    const filterables = (0, pick_1.default)(req.query, content_constants_1.contentFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await content_service_1.ContentServices.getAllMyContents(userId, filterables, pagination);
    const locale = (0, pickLocalized_1.getRequestLocale)(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contents retrieved successfully',
        data: {
            ...result,
            data: result.data.map(doc => (0, content_serializer_1.toPublicContent)(doc, locale)),
        },
    });
});
const generateCaption = (0, catchAsync_1.default)(async (req, res) => {
    const { templateId, tone, suggestions } = req.body;
    const result = await content_service_1.ContentServices.generateCaption(templateId, tone, suggestions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Caption generated successfully',
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
    generateCaption,
};
