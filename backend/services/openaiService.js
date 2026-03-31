'use strict';

const https = require('https');
const { MODELS } = require('../config/aiModels');
const { CACHED_PROMPTS } = require('../config/promptCache');
const { calculateCost } = require('../config/costCalculator');

const MODEL_ID = process.env.OPENAI_MODEL || MODELS.openai.name;
const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Make an HTTP POST request to the OpenAI chat completions API.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
function openaiPost(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
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
              reject(new Error(`OpenAI API error ${res.statusCode}: ${parsed.error?.message || data}`));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error(`Failed to parse OpenAI response: ${e.message}`));
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
 * Generate content using the OpenAI API.
 *
 * @param {object} options
 * @param {string}  options.userPrompt       - The user-facing prompt
 * @param {string}  [options.promptType]     - Key in CACHED_PROMPTS (e.g. 'BLOG_WRITER')
 * @param {string}  [options.systemPrompt]   - Custom system prompt (overrides promptType)
 * @param {number}  [options.maxTokens]      - Max output tokens (default 1024)
 * @returns {Promise<GenerationResult>}
 */
async function generate(options = {}) {
  const {
    userPrompt,
    promptType,
    systemPrompt: customSystemPrompt,
    maxTokens = 1024,
  } = options;

  if (!userPrompt) {
    throw new Error('userPrompt is required');
  }

  const systemText =
    customSystemPrompt ||
    (promptType && CACHED_PROMPTS[promptType]) ||
    'You are a helpful AI assistant.';

  const startTime = Date.now();

  const payload = {
    model: MODEL_ID,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemText },
      { role: 'user', content: userPrompt },
    ],
  };

  const response = await openaiPost(payload);

  const responseTime = (Date.now() - startTime) / 1000;
  const content = response.choices?.[0]?.message?.content || '';

  const usage = response.usage || {};
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;

  const costInfo = calculateCost('openai', { inputTokens, outputTokens });

  return {
    content,
    model: 'openai',
    modelId: MODEL_ID,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      cacheWrite: 0,
      cacheRead: 0,
    },
    cacheHit: false,
    cost: costInfo.total,
    costBreakdown: costInfo.breakdown,
    responseTime,
  };
}

module.exports = { generate };
