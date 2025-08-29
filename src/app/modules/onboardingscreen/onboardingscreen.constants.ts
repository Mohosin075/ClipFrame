// Filterable fields for Onboardingscreen
export const onboardingscreenFilterables = ['title', 'description', 'imageUrl', 'actionText'];

// Searchable fields for Onboardingscreen
export const onboardingscreenSearchableFields = ['title', 'description', 'imageUrl', 'actionText'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};