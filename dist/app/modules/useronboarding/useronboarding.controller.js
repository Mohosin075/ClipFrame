"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseronboardingController = void 0;
const useronboarding_service_1 = require("./useronboarding.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../../shared/pick"));
const useronboarding_constants_1 = require("./useronboarding.constants");
const pagination_1 = require("../../../interfaces/pagination");
const createUseronboarding = (0, catchAsync_1.default)(async (req, res) => {
    const useronboardingData = req.body;
    console.log({ useronboardingData });
    const result = await useronboarding_service_1.UseronboardingServices.createUseronboarding(req.user, useronboardingData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Useronboarding created successfully',
        data: result,
    });
});
const getSingleUseronboarding = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await useronboarding_service_1.UseronboardingServices.getSingleUseronboarding(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Useronboarding retrieved successfully',
        data: result,
    });
});
const getAllUseronboardings = (0, catchAsync_1.default)(async (req, res) => {
    const filterables = (0, pick_1.default)(req.query, useronboarding_constants_1.useronboardingFilterables);
    const pagination = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await useronboarding_service_1.UseronboardingServices.getAllUseronboardings(req.user, filterables, pagination);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Useronboardings retrieved successfully',
        data: result,
    });
});
const deleteUseronboarding = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await useronboarding_service_1.UseronboardingServices.deleteUseronboarding(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Useronboarding deleted successfully',
        data: result,
    });
});
exports.UseronboardingController = {
    createUseronboarding,
    getSingleUseronboarding,
    getAllUseronboardings,
    deleteUseronboarding,
};
