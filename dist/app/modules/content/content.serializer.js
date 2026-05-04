"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicContent = toPublicContent;
const pickLocalized_1 = require("../../../shared/pickLocalized");
function toPlainObject(doc) {
    if (doc &&
        typeof doc === 'object' &&
        'toObject' in doc &&
        typeof doc.toObject ===
            'function') {
        return doc.toObject();
    }
    return { ...doc };
}
/**
 * API response shape: one `caption` for the request locale.
 * If `captionI18n` is stored, it is resolved and `captionI18n` is omitted.
 * If only `caption` exists, it is returned unchanged.
 */
function toPublicContent(doc, locale) {
    var _a;
    const o = toPlainObject(doc);
    const i18n = o.captionI18n;
    const hasI18n = i18n != null &&
        typeof i18n === 'object' &&
        !Array.isArray(i18n) &&
        (Boolean(i18n.en) ||
            Boolean(i18n.es));
    const { captionI18n: _drop, ...rest } = o;
    const resolvedCaption = hasI18n
        ? (_a = (0, pickLocalized_1.pickLocalized)(i18n, locale)) !== null && _a !== void 0 ? _a : o.caption
        : o.caption;
    return {
        ...rest,
        caption: resolvedCaption,
    };
}
