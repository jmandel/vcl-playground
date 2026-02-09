// Terminology profile resolution for evaluator behavior that depends on
// code-system semantics (e.g., how "concept" hierarchy traversal is backed).

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

const BUILTIN_PROFILES = {
  [RXNORM_SYSTEM]: {
    conceptHierarchyProperty: 'isa',
  },
};

function normalizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return {};
  const out = {};
  if (typeof profile.conceptHierarchyProperty === 'string' && profile.conceptHierarchyProperty.length > 0) {
    out.conceptHierarchyProperty = profile.conceptHierarchyProperty;
  }
  return out;
}

function getBuiltinTerminologyProfile(system) {
  if (!system || !BUILTIN_PROFILES[system]) return {};
  return BUILTIN_PROFILES[system];
}

function resolveTerminologyProfile(system, resolver) {
  const builtin = getBuiltinTerminologyProfile(system);
  if (typeof resolver !== 'function') return normalizeProfile(builtin);
  const custom = resolver(system);
  return { ...normalizeProfile(builtin), ...normalizeProfile(custom) };
}

export { RXNORM_SYSTEM, getBuiltinTerminologyProfile, resolveTerminologyProfile };
