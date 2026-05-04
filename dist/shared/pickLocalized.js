"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestLocale = getRequestLocale;
exports.pickLocalized = pickLocalized;
const SUPPORTED = new Set(['en', 'es']);
function getRequestLocale(req) {
    var _a, _b;
    const lang = req.language;
    if (lang && SUPPORTED.has(lang)) {
        return lang;
    }
    const header = req.headers['accept-language'];
    if (typeof header === 'string') {
        const first = (_b = (_a = header.split(',')[0]) === null || _a === void 0 ? void 0 : _a.trim().split('-')[0]) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        if (first === 'es')
            return 'es';
    }
    return 'en';
}
/**
 * Pick a single-language string from a DB field that may be a plain string
 * or an object { en, es }.
 */
function pickLocalized(value, locale) {
    var _a;
    if (value == null)
        return undefined;
    if (typeof value === 'string')
        return value;
    const fromLocale = value[locale];
    if (fromLocale)
        return fromLocale;
    return (_a = value.en) !== null && _a !== void 0 ? _a : value.es;
}
