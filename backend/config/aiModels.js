'use strict';

/**
 * AI model configurations, pricing, and selection logic.
 */

const MODELS = {
  claude: {
    name: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    provider: 'anthropic',
    maxTokens: 4096,
    supportsVision: true,
    supportsCaching: true,
  },
  openai: {
    name: 'gpt-4',
    displayName: 'GPT-4',
    provider: 'openai',
    maxTokens: 4096,
    supportsVision: false,
    supportsCaching: false,
  },
};

/**
 * Pricing in USD per 1,000 tokens.
 */
const PRICING = {
  claude: {
    input: 0.003,       // $3 per 1M tokens
    output: 0.015,      // $15 per 1M tokens
    cacheWrite: 0.00375, // $3.75 per 1M tokens (25 % surcharge)
    cacheRead: 0.0003,   // $0.30 per 1M tokens (90 % discount)
  },
  openai: {
    input: 0.01,        // $10 per 1M tokens
    output: 0.03,       // $30 per 1M tokens
    cacheWrite: 0,
    cacheRead: 0,
  },
};

/**
 * Per-content-type AI preference configuration.
 *
 * preferred  – ideal model for this type
 * fallback   – model to use when preferred is unavailable
 * cacheable  – whether the system prompt is worth caching
 */
const AI_SELECTION_LOGIC = {
  blog_post: {
    preferred: 'claude',
    fallback: 'openai',
    cacheablePrompt: true,
  },
  social_caption: {
    preferred: 'openai',
    fallback: 'claude',
    cacheablePrompt: true,
  },
  pdf_analysis: {
    preferred: 'claude',
    fallback: 'openai',
    cacheablePrompt: true,
  },
  email: {
    preferred: 'claude',
    fallback: 'openai',
    cacheablePrompt: true,
  },
  image_generation: {
    preferred: 'openai',
    fallback: 'claude',
    cacheablePrompt: false,
  },
  default: {
    preferred: 'claude',
    fallback: 'openai',
    cacheablePrompt: true,
  },
};

module.exports = { MODELS, PRICING, AI_SELECTION_LOGIC };
