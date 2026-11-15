export {
  calculateDamage,
  calculateCritValue,
  calculateKqmDefMultiplier,
  calculateKqmResMultiplier,
  calculateKqmAmplifyingReaction,
  calculateKqmAdditiveReactionBonus,
  calculateKqmAverageCritMultiplier,
  getKqmLevelMultiplier,
  KQM_STANDARD_ENEMY,
  type DamageCalculationResult,
  type DamageDistribution,
} from './engine';

export {
  damageConfigs,
  hasDamageConfig,
  getConfiguredCharacters,
  type DamageConfig,
} from './configs';
