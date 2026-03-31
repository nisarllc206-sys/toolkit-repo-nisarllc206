'use strict';

const { PRICING } = require('./aiModels');

/**
 * Calculate the cost of a generation request in USD.
 *
 * @param {string} model        - 'claude' | 'openai'
 * @param {object} tokenUsage
 * @param {number} tokenUsage.inputTokens
 * @param {number} tokenUsage.outputTokens
 * @param {number} [tokenUsage.cacheWriteTokens]
 * @param {number} [tokenUsage.cacheReadTokens]
 * @returns {{ total: number, breakdown: object }}
 */
function calculateCost(model, tokenUsage) {
  const pricing = PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const {
    inputTokens = 0,
    outputTokens = 0,
    cacheWriteTokens = 0,
    cacheReadTokens = 0,
  } = tokenUsage;

  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  const cacheWriteCost = (cacheWriteTokens / 1000) * pricing.cacheWrite;
  const cacheReadCost = (cacheReadTokens / 1000) * pricing.cacheRead;

  const total = inputCost + outputCost + cacheWriteCost + cacheReadCost;

  return {
    total: parseFloat(total.toFixed(6)),
    breakdown: {
      inputCost: parseFloat(inputCost.toFixed(6)),
      outputCost: parseFloat(outputCost.toFixed(6)),
      cacheWriteCost: parseFloat(cacheWriteCost.toFixed(6)),
      cacheReadCost: parseFloat(cacheReadCost.toFixed(6)),
    },
  };
}

/**
 * Estimate the cost savings when a cached prompt is reused.
 *
 * @param {number} cachedTokens   - tokens served from cache
 * @param {number} reuseCount     - how many times the cache entry was read
 * @returns {number} savings in USD
 */
function estimateCacheSavings(cachedTokens, reuseCount = 1) {
  const normalCost = (cachedTokens / 1000) * PRICING.claude.input * reuseCount;
  const cachedCost = (cachedTokens / 1000) * PRICING.claude.cacheRead * reuseCount;
  return parseFloat((normalCost - cachedCost).toFixed(6));
}

module.exports = { calculateCost, estimateCacheSavings };
