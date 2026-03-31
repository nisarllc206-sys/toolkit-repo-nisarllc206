const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Tool = require('../models/Tool');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/tools
router.get('/', async (req, res, next) => {
  try {
    const { category, isFree, page = 1, limit = 20 } = req.query;
    const result = await Tool.findAll({
      category,
      isFree: isFree !== undefined ? isFree === 'true' : undefined,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/tools/:id
router.get('/:id', async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    await Tool.incrementUsage(req.params.id).catch(() => {});
    res.json({ tool });
  } catch (error) {
    next(error);
  }
});

// POST /api/tools (admin only)
router.post('/', authMiddleware, adminMiddleware, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('url').isURL(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const tool = await Tool.create(req.body);
    res.status(201).json({ tool });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tools/:id (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });

    const updated = await Tool.update(req.params.id, req.body);
    res.json({ tool: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tools/:id (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });

    await Tool.delete(req.params.id);
    res.json({ message: 'Tool deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/tools/:id/rate
router.post('/:id/rate', authMiddleware, [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const tool = await Tool.rate(req.params.id, req.body.rating);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });

    res.json({ tool });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
