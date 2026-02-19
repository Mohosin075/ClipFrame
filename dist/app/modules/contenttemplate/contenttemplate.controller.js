"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContenttemplateController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const contenttemplate_constants_1 = require("./contenttemplate.constants");
const pagination_1 = require("../../../interfaces/pagination");
const contenttemplate_service_1 = require("./contenttemplate.service");
const createContenttemplate = (0, catchAsync_1.default)(async (req, res) => {
    const contenttemplateData = req.body;
    console.log(contenttemplateData);
    const result = await contenttemplate_service_1.ContenttemplateServices.createContentTemplate(req.user, contenttemplateData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Contenttemplate created successfully',
        data: result,
    });
});
const updateContenttemplate = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const contenttemplateData = req.body;
    const result = await contenttemplate_service_1.ContenttemplateServices.updateContentTemplate(id, contenttemplateData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contenttemplate updated successfully',
        data: result,
    });
});
const getSingleContenttemplate = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await contenttemplate_service_1.ContenttemplateServices.getSingleContentTemplate(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contenttemplate retrieved successfully',
        data: result,
    });
});
const getAllContenttemplates = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, contenttemplate_constants_1.contenttemplateFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await contenttemplate_service_1.ContenttemplateServices.getAllContentTemplates(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contenttemplates retrieved successfully',
        data: result,
    });
});
const deleteContenttemplate = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await contenttemplate_service_1.ContenttemplateServices.deleteContentTemplate(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contenttemplate deleted successfully',
        data: result,
    });
});
const toggleTemplateLove = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const result = await contenttemplate_service_1.ContenttemplateServices.toggleTemplateLove(id, user.authId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Updated Love successfully',
        data: result,
    });
});
const getRecentTemplates = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, contenttemplate_constants_1.contenttemplateFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await contenttemplate_service_1.ContenttemplateServices.getRecentTemplates(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Contenttemplates retrieved successfully',
        data: result,
    });
});
exports.ContenttemplateController = {
    createContenttemplate,
    updateContenttemplate,
    getSingleContenttemplate,
    getAllContenttemplates,
    deleteContenttemplate,
    toggleTemplateLove,
    getRecentTemplates,
};
