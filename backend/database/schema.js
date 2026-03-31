'use strict';

/**
 * Firestore schema definitions for AI preferences, cache entries,
 * and generation records.
 *
 * This module provides helper objects that describe the expected shape of each
 * Firestore document.  Use the factory functions to create new documents with
 * sensible defaults.
 */

/**
 * /users/{userId}/aiPreferences
 *
 * @typedef {object} AIPreferences
 * @property {'claude'|'openai'|'auto'} preferredModel
 * @property {boolean} cachingEnabled
 * @property {boolean} costOptimization
 * @property {object}  generationStats
 */

/**
 * Create a default AIPreferences document.
 * @param {Partial<AIPreferences>} [overrides]
 * @returns {AIPreferences}
 */
function createAIPreferences(overrides = {}) {
  return {
    preferredModel: 'auto',
    cachingEnabled: true,
    costOptimization: true,
    generationStats: {
      totalRequests: 0,
      cacheHits: 0,
      avgCost: 0,
    },
    ...overrides,
  };
}

/**
 * /cache/prompts/{cacheId}
 *
 * @typedef {object} CachePromptDoc
 * @property {string} promptHash
 * @property {'claude'|'openai'} model
 * @property {string} systemPrompt
 * @property {{ input: number, output: number, cached: number }} tokens
 * @property {FirebaseFirestore.Timestamp} createdAt
 * @property {number} ttl   - milliseconds
 * @property {number} hitCount
 */

/**
 * Create a default CachePromptDoc.
 * @param {object} data
 * @param {string} data.promptHash
 * @param {string} data.model
 * @param {string} data.systemPrompt
 * @param {object} [data.tokens]
 * @param {number} [data.ttl]
 * @returns {CachePromptDoc}
 */
function createCachePromptDoc(data) {
  return {
    promptHash: data.promptHash,
    model: data.model || 'claude',
    systemPrompt: data.systemPrompt,
    tokens: {
      input: data.tokens?.input || 0,
      output: data.tokens?.output || 0,
      cached: data.tokens?.cached || 0,
    },
    createdAt: new Date(),
    ttl: data.ttl || 3_600_000,
    hitCount: 0,
  };
}

/**
 * /generations/{generationId}
 *
 * @typedef {object} GenerationDoc
 * @property {string} userId
 * @property {'claude'|'openai'} model
 * @property {string} contentType
 * @property {{ input: number, output: number, cached: number }} tokens
 * @property {number} cost
 * @property {boolean} cacheHit
 * @property {number|null} quality   - 1–5 rating, set after user feedback
 * @property {FirebaseFirestore.Timestamp} timestamp
 */

/**
 * Create a default GenerationDoc.
 * @param {object} data
 * @returns {GenerationDoc}
 */
function createGenerationDoc(data) {
  return {
    userId: data.userId || 'anonymous',
    model: data.model || 'claude',
    contentType: data.contentType || 'default',
    tokens: {
      input: data.tokens?.input || 0,
      output: data.tokens?.output || 0,
      cached: data.tokens?.cacheRead || 0,
    },
    cost: data.cost || 0,
    cacheHit: data.cacheHit || false,
    quality: null,
    timestamp: new Date(),
  };
}

module.exports = { createAIPreferences, createCachePromptDoc, createGenerationDoc };
