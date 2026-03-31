'use strict';

const https = require('https');
const { MODELS } = require('../config/aiModels');
const { CACHED_PROMPTS } = require('../config/promptCache');
const promptCache = require('./promptCache');
const { calculateCost, estimateCacheSavings } = require('../config/costCalculator');

const MODEL_ID = process.env.CLAUDE_MODEL || MODELS.claude.name;
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/**
 * Make an HTTP POST request to the Anthropic messages API.
 * Uses Node's built-in `https` module to avoid adding dependencies.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
function anthropicPost(payload) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION,
          'anthropic-beta': 'prompt-caching-2024-07-31',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`Anthropic API error ${res.statusCode}: ${parsed.error?.message || data}`));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error(`Failed to parse Anthropic response: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Generate content using the Claude API with optional prompt caching.
 *
 * @param {object} options
 * @param {string}  options.userPrompt         - The user-facing prompt
 * @param {string}  [options.promptType]       - Key in CACHED_PROMPTS (e.g. 'BLOG_WRITER')
 * @param {string}  [options.systemPrompt]     - Custom system prompt (overrides promptType)
 * @param {boolean} [options.enableCaching]    - Whether to request Anthropic prompt caching
 * @param {number}  [options.maxTokens]        - Max output tokens (default 1024)
 * @returns {Promise<GenerationResult>}
 */
async function generate(options = {}) {
  const {
    userPrompt,
    promptType,
    systemPrompt: customSystemPrompt,
    enableCaching = true,
    maxTokens = 1024,
  } = options;

  if (!userPrompt) {
    throw new Error('userPrompt is required');
  }

  const systemText =
    customSystemPrompt ||
    (promptType && CACHED_PROMPTS[promptType]) ||
    'You are a helpful AI assistant.';

  const promptHash = promptCache.hashPrompt(systemText);
  const cached = promptCache.get(promptHash);

  const startTime = Date.now();

  // Build the system block. When caching is enabled, add the `cache_control`
  // ephemeral marker so Anthropic can cache the prefix.
  const systemBlock = enableCaching
    ? [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }]
    : systemText;

  const payload = {
    model: MODEL_ID,
    max_tokens: maxTokens,
    system: systemBlock,
    messages: [{ role: 'user', content: userPrompt }],
  };

  const response = await anthropicPost(payload);

  const responseTime = (Date.now() - startTime) / 1000;
  const content = response.content?.[0]?.text || '';

  const usage = response.usage || {};
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const cacheWriteTokens = usage.cache_creation_input_tokens || 0;
  const cacheReadTokens = usage.cache_read_input_tokens || 0;
  const cacheHit = cacheReadTokens > 0;

  // Update local cache entry.
  if (!cached) {
    promptCache.set(promptHash, {
      promptType: promptType || 'custom',
      model: 'claude',
      systemPrompt: systemText,
      tokens: inputTokens,
    });
  }

  const costInfo = calculateCost('claude', {
    inputTokens,
    outputTokens,
    cacheWriteTokens,
    cacheReadTokens,
  });

  if (cacheHit) {
    const savings = estimateCacheSavings(cacheReadTokens, 1);
    promptCache.recordSavings(savings);
  }

  return {
    content,
    model: 'claude',
    modelId: MODEL_ID,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      cacheWrite: cacheWriteTokens,
      cacheRead: cacheReadTokens,
    },
    cacheHit,
    cost: costInfo.total,
    costBreakdown: costInfo.breakdown,
    responseTime,
  };
}

module.exports = { generate };
