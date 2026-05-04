"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse_1 = __importDefault(require("./sendResponse"));
const resolveTranslatedMessage_1 = require("../i18n/resolveTranslatedMessage");
/**
 * Same as sendResponse but resolves `messageKey` with the request locale
 * (Accept-Language or ?lang=es). Falls back to `message` when no key.
 */
const sendLocalizedResponse = (req, res, data) => {
    var _a, _b, _c;
    const resolvedMessage = data.messageKey != null && data.messageKey !== ''
        ? (0, resolveTranslatedMessage_1.translateIfKey)(req, data.messageKey, data.messageValues)
        : (_a = data.message) !== null && _a !== void 0 ? _a : null;
    (0, sendResponse_1.default)(res, {
        statusCode: data.statusCode,
        success: data.success,
        message: resolvedMessage,
        meta: (_b = data.meta) !== null && _b !== void 0 ? _b : undefined,
        data: (_c = data.data) !== null && _c !== void 0 ? _c : undefined,
    });
};
exports.default = sendLocalizedResponse;
