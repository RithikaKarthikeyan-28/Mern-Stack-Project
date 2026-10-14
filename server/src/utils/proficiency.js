const PROFICIENCY_RANKS = Object.freeze({
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4
});

const PROFICIENCY_LEVELS = Object.freeze(['beginner', 'intermediate', 'advanced', 'expert']);

/**
 * Returns the numeric rank for a given proficiency level string.
 *
 * @param {string} [level] - Proficiency level string
 * @returns {number|null} 1-4 if valid, or null if missing/invalid
 */
function getProficiencyRank(level) {
  if (!level || typeof level !== 'string') {
    return null;
  }
  const normalized = level.trim().toLowerCase();
  return PROFICIENCY_RANKS[normalized] || null;
}

/**
 * Deterministically compares an employee's current proficiency level against
 * a required proficiency level.
 *
 * @param {string|null} currentLevel - Employee's current level (or null/undefined)
 * @param {string} requiredLevel - Required proficiency level
 * @returns {object} Comparison outcome:
 *   - status: 'MISSING' | 'BELOW_REQUIRED' | 'MEETS_REQUIRED'
 *   - currentRank: number | null (1..4)
 *   - requiredRank: number (1..4)
 *   - diff: number (currentRank - requiredRank, or -requiredRank if currentRank is null)
 *   - meets: boolean
 *   - below: boolean
 *   - missing: boolean
 */
function compareProficiency(currentLevel, requiredLevel) {
  const requiredRank = getProficiencyRank(requiredLevel);
  if (!requiredRank) {
    throw new Error(`Invalid required proficiency level: ${requiredLevel}`);
  }

  const currentRank = getProficiencyRank(currentLevel);

  if (currentRank === null) {
    return {
      status: 'MISSING',
      currentRank: null,
      requiredRank,
      diff: -requiredRank,
      meets: false,
      below: false,
      missing: true
    };
  }

  const diff = currentRank - requiredRank;

  if (diff < 0) {
    return {
      status: 'BELOW_REQUIRED',
      currentRank,
      requiredRank,
      diff,
      meets: false,
      below: true,
      missing: false
    };
  }

  return {
    status: 'MEETS_REQUIRED',
    currentRank,
    requiredRank,
    diff,
    meets: true,
    below: false,
    missing: false
  };
}

module.exports = {
  PROFICIENCY_RANKS,
  PROFICIENCY_LEVELS,
  getProficiencyRank,
  compareProficiency
};
