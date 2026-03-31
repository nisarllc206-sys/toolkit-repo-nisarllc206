'use strict';

const crypto = require('crypto');
const { CACHE_TTL } = require('../config/promptCache');

/**
 * Lightweight in-process prompt cache.
 *
 * Stores system-prompt metadata so the application can track cache hits/misses
 * and forward the correct `cache_control` headers to the Anthropic API.
 * The actual LLM-level caching is performed by Anthropic; this layer tracks
 * statistics and reuses prompt hashes across requests.
 */
class PromptCache {
  constructor() {
    /** @type {Map<string, CacheEntry>} */
    this._store = new Map();
    this._stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      costSaved: 0,
    };
  }

  /**
   * Generate a deterministic hash for a system prompt string.
   * @param {string} prompt
   * @returns {string}
   */
  static hashPrompt(prompt) {
    return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
  }

  /**
   * Look up a cached prompt entry.
   * @param {string} promptHash
   * @returns {CacheEntry|null}
   */
  get(promptHash) {
    this._stats.totalRequests++;
    const entry = this._store.get(promptHash);

    if (!entry) {
      this._stats.misses++;
      return null;
    }

    if (Date.now() - entry.createdAt > (entry.ttl || CACHE_TTL)) {
      this._store.delete(promptHash);
      this._stats.misses++;
      return null;
    }

    entry.hitCount++;
    this._stats.hits++;
    return entry;
  }

  /**
   * Store a prompt in the cache.
   * @param {string} promptHash
   * @param {object} data
   * @param {string} data.promptType
   * @param {string} data.model
   * @param {string} data.systemPrompt
   * @param {number} [data.tokens]
   * @param {number} [data.ttl]
   * @returns {CacheEntry}
   */
  set(promptHash, data) {
    const entry = {
      promptHash,
      promptType: data.promptType || 'custom',
      model: data.model || 'claude',
      systemPrompt: data.systemPrompt,
      tokens: data.tokens || 0,
      ttl: data.ttl || CACHE_TTL,
      createdAt: Date.now(),
      hitCount: 0,
    };
    this._store.set(promptHash, entry);
    return entry;
  }

  /**
   * Record cost savings from a cache hit.
   * @param {number} amount  - USD saved
   */
  recordSavings(amount) {
    this._stats.costSaved += amount;
  }

  /**
   * Return aggregated cache statistics.
   * @returns {object}
   */
  getStats() {
    const { hits, misses, totalRequests, costSaved } = this._stats;
    const hitRate =
      totalRequests > 0
        ? ((hits / totalRequests) * 100).toFixed(2) + '%'
        : '0.00%';

    const topEntries = [...this._store.values()]
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 5)
      .map(({ promptType, hitCount, tokens }) => ({
        promptType,
        hitCount,
        savedTokens: hitCount * tokens,
      }));

    return {
      totalRequests,
      cacheHits: hits,
      cacheMisses: misses,
      hitRate,
      costSaved: parseFloat(costSaved.toFixed(4)),
      activeEntries: this._store.size,
      topCachedPrompts: topEntries,
    };
  }

  /** Remove all expired entries from the store. */
  evictExpired() {
    const now = Date.now();
    for (const [key, entry] of this._store.entries()) {
      if (now - entry.createdAt > (entry.ttl || CACHE_TTL)) {
        this._store.delete(key);
      }
    }
  }

  /** Clear the entire cache. */
  clear() {
    this._store.clear();
    this._stats = { hits: 0, misses: 0, totalRequests: 0, costSaved: 0 };
  }
}

// Singleton instance shared across the application.
const promptCache = new PromptCache();

// Expose the static helper on the instance for convenience.
promptCache.hashPrompt = PromptCache.hashPrompt;

// Evict stale entries every 10 minutes.
setInterval(() => promptCache.evictExpired(), 10 * 60 * 1000).unref();

module.exports = promptCache;
