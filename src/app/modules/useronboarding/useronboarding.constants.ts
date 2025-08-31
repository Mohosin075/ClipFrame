// Filterable fields for Useronboarding
export const useronboardingFilterables = ['businessType', 'customBusinessType', 'businessDescription'];

// Searchable fields for Useronboarding
export const useronboardingSearchableFields = ['businessType', 'customBusinessType', 'businessDescription'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};