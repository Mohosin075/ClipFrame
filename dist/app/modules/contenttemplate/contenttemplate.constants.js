"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.contenttemplateSearchableFields = exports.contenttemplateFilterables = void 0;
// Filterable fields for Contenttemplate
exports.contenttemplateFilterables = ['title', 'description', 'category', 'thumbnail', 'type'];
// Searchable fields for Contenttemplate
exports.contenttemplateSearchableFields = ['title', 'description', 'category', 'thumbnail'];
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
