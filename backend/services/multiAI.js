'use strict';

const claudeAI = require('./claudeAI');
const openaiService = require('./openaiService');
const { AI_SELECTION_LOGIC } = require('../config/aiModels');

/**
 * Resolve which AI service to use given user preference and content type.
 *
 * @param {string} userPreference - 'claude' | 'openai' | 'auto'
 * @param {string} contentType    - e.g. 'blog_post', 'social_caption'
 * @returns {{ primary: string, fallback: string }}
 */
function resolveModel(userPreference, contentType) {
  if (userPreference === 'claude') return { primary: 'claude', fallback: 'openai' };
  if (userPreference === 'openai') return { primary: 'openai', fallback: 'claude' };

  // 'auto' — pick intelligently by content type
  const rule = AI_SELECTION_LOGIC[contentType] || AI_SELECTION_LOGIC.default;
  return { primary: rule.preferred, fallback: rule.fallback };
}

/**
 * Map model name to its service module.
 * @param {string} model
 * @returns {{ generate: Function }}
 */
function getService(model) {
  if (model === 'claude') return claudeAI;
  if (model === 'openai') return openaiService;
  throw new Error(`Unknown model: ${model}`);
}

/**
 * Generate content using the specified or auto-selected AI model.
 * Falls back to the alternative model if the primary call fails.
 *
 * @param {object} options
 * @param {string}  options.userPrompt       - The prompt to send
 * @param {string}  [options.contentType]    - Content category (for auto-selection)
 * @param {string}  [options.promptType]     - System prompt key (CACHED_PROMPTS)
 * @param {string}  [options.model]          - Force a specific model ('claude'|'openai'|'auto')
 * @param {string}  [options.userPreference] - User's stored preference
 * @param {boolean} [options.enableCaching]  - Pass through to Claude service
 * @param {number}  [options.maxTokens]
 * @returns {Promise<GenerationResult>}
 */
async function generate(options = {}) {
  const {
    userPrompt,
    contentType = 'default',
    promptType,
    model,
    userPreference = process.env.DEFAULT_AI_MODEL || 'auto',
    enableCaching = process.env.ENABLE_PROMPT_CACHING !== 'false',
    maxTokens,
  } = options;

  const preference = model && model !== 'auto' ? model : userPreference;
  const { primary, fallback } = resolveModel(preference, contentType);

  const serviceOptions = { userPrompt, promptType, enableCaching, maxTokens };

  try {
    const result = await getService(primary).generate(serviceOptions);
    return { ...result, selectedModel: primary, usedFallback: false };
  } catch (primaryError) {
    console.error(`[multiAI] Primary model (${primary}) failed:`, primaryError.message);
    console.info(`[multiAI] Falling back to ${fallback}…`);

    try {
      const result = await getService(fallback).generate(serviceOptions);
      return { ...result, selectedModel: fallback, usedFallback: true };
    } catch (fallbackError) {
      throw new Error(
        `Both AI services failed. Primary (${primary}): ${primaryError.message}. ` +
        `Fallback (${fallback}): ${fallbackError.message}`
      );
    }
  }
}

/**
 * Generate content from both models in parallel and return both results.
 *
 * @param {object} options
 * @param {string} options.userPrompt
 * @param {string} [options.promptType]
 * @param {number} [options.maxTokens]
 * @returns {Promise<{ claude: GenerationResult, openai: GenerationResult, recommendation: string }>}
 */
async function compareModels(options = {}) {
  const { userPrompt, promptType, maxTokens } = options;

  const serviceOptions = { userPrompt, promptType, maxTokens };

  const [claudeResult, openaiResult] = await Promise.allSettled([
    claudeAI.generate({ ...serviceOptions, enableCaching: true }),
    openaiService.generate(serviceOptions),
  ]);

  const claude = claudeResult.status === 'fulfilled' ? claudeResult.value : { error: claudeResult.reason?.message };
  const openai = openaiResult.status === 'fulfilled' ? openaiResult.value : { error: openaiResult.reason?.message };

  // Recommend the model with the lower cost (if both succeeded).
  let recommendation = 'claude';
  if (claude.cost != null && openai.cost != null) {
    recommendation = claude.cost <= openai.cost ? 'claude' : 'openai';
  } else if (claude.error) {
    recommendation = 'openai';
  }

  return { claude, openai, recommendation };
}

module.exports = { generate, compareModels, resolveModel };
