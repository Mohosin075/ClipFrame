"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.categorySearchableFields = exports.categoryFilterables = void 0;
// Filterable fields for Category
exports.categoryFilterables = ['name', 'description'];
// Searchable fields for Category
exports.categorySearchableFields = ['name', 'description'];
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
