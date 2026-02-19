"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.contentSearchableFields = exports.CONTENT_STATUS = exports.contentFilterables = void 0;
// Filterable fields for Content
exports.contentFilterables = [
    'title',
    'description',
    'contentType',
    'status',
    'date', // <-- now your code will pick up date
];
exports.CONTENT_STATUS = {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    PUBLISHED: 'published',
    FAILED: 'failed',
    DELETED: 'deleted',
};
// Searchable fields for Content
exports.contentSearchableFields = ['title', 'description'];
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
