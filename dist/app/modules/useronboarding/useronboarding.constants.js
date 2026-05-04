"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.useronboardingSearchableFields = exports.useronboardingFilterables = void 0;
// Filterable fields for Useronboarding
exports.useronboardingFilterables = ['businessType', 'customBusinessType', 'businessDescription'];
// Searchable fields for Useronboarding
exports.useronboardingSearchableFields = ['businessType', 'customBusinessType', 'businessDescription'];
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
