// Filterable fields for Socialintegration
export const socialintegrationFilterables = ['accountId', 'accessToken', 'refreshToken'];

// Searchable fields for Socialintegration
export const socialintegrationSearchableFields = ['accountId', 'accessToken', 'refreshToken'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};