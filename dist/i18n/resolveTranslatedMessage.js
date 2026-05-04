"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTranslatedMessage = resolveTranslatedMessage;
exports.translateIfKey = translateIfKey;
const i18n_1 = __importDefault(require("./i18n"));
const legacyMessageMap_1 = require("./legacyMessageMap");
function resolveTranslatedMessage(req, error) {
    var _a, _b, _c;
    const raw = (_a = error.message) !== null && _a !== void 0 ? _a : '';
    const key = (_c = (_b = error.messageKey) !== null && _b !== void 0 ? _b : legacyMessageMap_1.legacyApiMessageToKey[raw]) !== null && _c !== void 0 ? _c : undefined;
    const tFn = typeof req.t === 'function'
        ? req.t
        : i18n_1.default.getFixedT(req.language || 'en', 'translation');
    if (key) {
        return String(tFn(key, {
            ...error.messageValues,
            defaultValue: raw || key,
        }));
    }
    return raw;
}
function translateIfKey(req, key, values) {
    const tFn = typeof req.t === 'function'
        ? req.t
        : i18n_1.default.getFixedT(req.language || 'en', 'translation');
    return String(tFn(key, { ...values, defaultValue: key }));
}
