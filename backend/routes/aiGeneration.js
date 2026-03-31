'use strict';

const express = require('express');
const router = express.Router();

const multiAI = require('../services/multiAI');
const claudeAI = require('../services/claudeAI');
const openaiService = require('../services/openaiService');
const AICacheStats = require('../models/AICacheStats');
const aiSelector = require('../middleware/aiSelector');
const { calculateCost } = require('../config/costCalculator');
const { PRICING } = require('../config/aiModels');

// ─── Helper ──────────────────────────────────────────────────────────────────

function extractGenerateOptions(body) {
  return {
    userPrompt: body.prompt || body.topic
      ? `Write a ${body.contentType || 'piece'} about: ${body.topic || body.prompt}`
      : body.userPrompt,
    contentType: body.contentType || 'default',
    promptType: body.promptType,
    maxTokens: body.maxTokens,
    enableCaching: body.enableCaching !== false,
  };
}

// ─── POST /api/ai/generate  (use default AI / user preference) ───────────────

router.post('/generate', aiSelector, async (req, res) => {
  try {
    const options = {
      ...extractGenerateOptions(req.body),
      model: req.aiModel,
      userPreference: req.body.userPreference,
    };

    const result = await multiAI.generate(options);
    return res.json(result);
  } catch (err) {
    console.error('[POST /generate]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate/claude  (force Claude) ────────────────────────────

router.post('/generate/claude', async (req, res) => {
  try {
    const options = extractGenerateOptions(req.body);
    const result = await claudeAI.generate(options);
    return res.json(result);
  } catch (err) {
    console.error('[POST /generate/claude]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate/openai  (force OpenAI) ────────────────────────────

router.post('/generate/openai', async (req, res) => {
  try {
    const options = extractGenerateOptions(req.body);
    const result = await openaiService.generate(options);
    return res.json(result);
  } catch (err) {
    console.error('[POST /generate/openai]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/generate/compare  (both models side-by-side) ───────────────

router.post('/generate/compare', async (req, res) => {
  try {
    const options = extractGenerateOptions(req.body);
    const result = await multiAI.compareModels(options);
    return res.json(result);
  } catch (err) {
    console.error('[POST /generate/compare]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/preferences  (store user AI preference) ────────────────────

router.post('/preferences', (req, res) => {
  const { preferredModel, cachingEnabled, costOptimization } = req.body;
  const allowed = ['claude', 'openai', 'auto'];

  if (preferredModel && !allowed.includes(preferredModel)) {
    return res.status(400).json({
      error: `preferredModel must be one of: ${allowed.join(', ')}`,
    });
  }

  // In a real implementation this would persist to Firestore.
  // Return the received preferences as confirmation.
  return res.json({
    success: true,
    preferences: {
      preferredModel: preferredModel || 'auto',
      cachingEnabled: cachingEnabled !== false,
      costOptimization: costOptimization !== false,
    },
  });
});

// ─── GET /api/ai/cache-stats  (cache performance metrics) ────────────────────

// Fraction of normal input cost saved when a token is served from cache (90% discount).
const CACHE_DISCOUNT_RATE = 0.9;

router.get('/cache-stats', (_req, res) => {
  try {
    const stats = AICacheStats.getStats();
    // Enrich top prompts with cost-saved estimates.
    const enriched = stats.topCachedPrompts.map((p) => ({
      ...p,
      costSaved: parseFloat(((p.savedTokens / 1000) * PRICING.claude.input * CACHE_DISCOUNT_RATE).toFixed(4)),
    }));
    return res.json({ ...stats, topCachedPrompts: enriched });
  } catch (err) {
    console.error('[GET /cache-stats]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/ai/cost-analysis  (cost comparison report) ─────────────────────

router.get('/cost-analysis', (_req, res) => {
  // Example: 2 000-token blog post, 5 reuses
  const inputTokens = 2000;
  const outputTokens = 500;
  const reuseCount = 5;

  const claudeSingle = calculateCost('claude', { inputTokens, outputTokens });
  const openaiSingle = calculateCost('openai', { inputTokens, outputTokens });

  // With caching: first call writes, subsequent calls read from cache.
  const claudeCached = calculateCost('claude', {
    inputTokens,
    outputTokens,
    cacheWriteTokens: inputTokens,
    cacheReadTokens: 0,
  });
  const claudeCachedReads = calculateCost('claude', {
    inputTokens: 0,
    outputTokens,
    cacheReadTokens: inputTokens,
  });

  const totalCacheCost =
    claudeCached.total + claudeCachedReads.total * (reuseCount - 1);
  const totalNoCacheClaude = claudeSingle.total * reuseCount;
  const totalNoCache = openaiSingle.total * reuseCount;

  return res.json({
    exampleScenario: {
      inputTokens,
      outputTokens,
      reuseCount,
    },
    perRequest: {
      claude: claudeSingle.total,
      openai: openaiSingle.total,
    },
    withCaching: {
      claude: parseFloat(totalCacheCost.toFixed(6)),
      claudeWithoutCache: parseFloat(totalNoCacheClaude.toFixed(6)),
      openai: parseFloat(totalNoCache.toFixed(6)),
      savingsVsOpenAI: parseFloat((totalNoCache - totalCacheCost).toFixed(6)),
      savingsPct: parseFloat(
        (((totalNoCache - totalCacheCost) / totalNoCache) * 100).toFixed(2)
      ),
    },
    pricing: PRICING,
  });
});

// ─── DELETE /api/ai/cache  (clear cache — admin use) ─────────────────────────

router.delete('/cache', (_req, res) => {
  AICacheStats.clearCache();
  return res.json({ success: true, message: 'Cache cleared' });
});

module.exports = router;
