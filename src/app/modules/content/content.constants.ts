// Filterable fields for Content
export const contentFilterables = ['title', 'description'];

// Searchable fields for Content
export const contentSearchableFields = ['title', 'description'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};