'use strict';

const promptCache = require('../services/promptCache');

/**
 * AICacheStats — a plain-object model that wraps the in-memory PromptCache
 * and presents statistics in the shape expected by the REST API and dashboard.
 */
class AICacheStats {
  /**
   * Retrieve the current cache snapshot.
   * @returns {object}
   */
  static getStats() {
    const raw = promptCache.getStats();

    return {
      totalRequests: raw.totalRequests,
      cacheHits: raw.cacheHits,
      cacheMisses: raw.cacheMisses,
      hitRate: raw.hitRate,
      costSaved: raw.costSaved,
      activeEntries: raw.activeEntries,
      topCachedPrompts: raw.topCachedPrompts,
    };
  }

  /**
   * Clear all cache entries and reset statistics.
   */
  static clearCache() {
    promptCache.clear();
  }
}

module.exports = AICacheStats;
