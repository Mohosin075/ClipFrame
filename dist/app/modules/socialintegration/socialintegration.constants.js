"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.socialintegrationSearchableFields = exports.socialintegrationFilterables = void 0;
// Filterable fields for Socialintegration
exports.socialintegrationFilterables = ['accountId', 'accessToken', 'refreshToken'];
// Searchable fields for Socialintegration
exports.socialintegrationSearchableFields = ['accountId', 'accessToken', 'refreshToken'];
// Helper function for set comparison
const isSetEqual = (setA, setB) => {
    if (setA.size !== setB.size)
        return false;
    for (const item of setA) {
        if (!setB.has(item))
            return false;
    }
    return true;
};
exports.isSetEqual = isSetEqual;
