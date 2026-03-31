'use strict';

const { AI_SELECTION_LOGIC } = require('../config/aiModels');

/**
 * Express middleware that resolves which AI model to use for a request and
 * attaches the decision to `req.aiModel`.
 *
 * Resolution order:
 *  1. `model` field in the request body (explicit override)
 *  2. `userPreference` derived from the authenticated session / body
 *  3. Intelligent selection based on `contentType` from the body
 *  4. Global default from `DEFAULT_AI_MODEL` env var (falls back to 'auto')
 */
function aiSelector(req, _res, next) {
  const {
    model: explicitModel,
    contentType = 'default',
    userPreference,
  } = req.body || {};

  const globalDefault = process.env.DEFAULT_AI_MODEL || 'auto';

  // Explicit model in request body wins.
  if (explicitModel && ['claude', 'openai', 'auto'].includes(explicitModel)) {
    req.aiModel = explicitModel;
    return next();
  }

  // User's stored preference (passed in body or resolved by auth middleware).
  const preference = userPreference || globalDefault;

  if (preference === 'claude' || preference === 'openai') {
    req.aiModel = preference;
    return next();
  }

  // 'auto' — look up the best model for this content type.
  const rule = AI_SELECTION_LOGIC[contentType] || AI_SELECTION_LOGIC.default;
  req.aiModel = rule.preferred;
  next();
}

module.exports = aiSelector;
