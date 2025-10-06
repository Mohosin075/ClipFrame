// Filterable fields for Contenttemplate
export const contenttemplateFilterables = ['title', 'description', 'category', 'thumbnail'];

// Searchable fields for Contenttemplate
export const contenttemplateSearchableFields = ['title', 'description', 'category', 'thumbnail'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};


