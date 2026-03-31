const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AIService = require('../services/ai');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const TEMPLATES = [
  { id: '1', name: 'Blog Post', type: 'blog', prompt: 'Write a comprehensive blog post about: {topic}' },
  { id: '2', name: 'Product Description', type: 'product', prompt: 'Write a compelling product description for: {product}' },
  { id: '3', name: 'Social Media Campaign', type: 'social', prompt: 'Create a social media campaign for: {campaign}' },
  { id: '4', name: 'Email Newsletter', type: 'email', prompt: 'Write an email newsletter about: {topic}' },
  { id: '5', name: 'SEO Article', type: 'blog', prompt: 'Write an SEO-optimized article targeting the keyword: {keyword}' },
];

// POST /api/content/generate
router.post('/generate', [
  body('prompt').trim().notEmpty().withMessage('Prompt is required'),
  body('type').optional().isIn(['blog', 'social', 'email', 'product']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { prompt, type = 'blog', options = {} } = req.body;
    const result = await AIService.generateContent(prompt, type, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/content/generate-image
router.post('/generate-image', [
  body('prompt').trim().notEmpty().withMessage('Prompt is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { prompt, options = {} } = req.body;
    const result = await AIService.generateImage(prompt, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/content/seo-optimize
router.post('/seo-optimize', [
  body('content').trim().notEmpty().withMessage('Content is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const metadata = await AIService.generateSEOMetadata(req.body.content);
    res.json({ metadata });
  } catch (error) {
    next(error);
  }
});

// GET /api/content/templates
router.get('/templates', (req, res) => {
  res.json({ templates: TEMPLATES });
});

// POST /api/content/templates/:id/use
router.post('/templates/:id/use', [
  body('variables').isObject().withMessage('Variables must be an object'),
], async (req, res, next) => {
  try {
    const template = TEMPLATES.find((t) => t.id === req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const { variables = {}, options = {} } = req.body;

    let prompt = template.prompt;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(`{${key}}`, value);
    }

    const result = await AIService.generateContent(prompt, template.type, options);
    res.json({ ...result, template: template.name });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
