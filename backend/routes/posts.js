const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const WordPressService = require('../services/wordpress');
const AIService = require('../services/ai');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../services/logger');

router.use(authMiddleware);

// GET /api/posts
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await Post.findByUser(req.user.id, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/posts
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('status').optional().isIn(['draft', 'published', 'scheduled']),
  body('platforms').optional().isArray(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const post = await Post.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({ post });
  } catch (error) {
    next(error);
  }
});

// PUT /api/posts/:id
router.put('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await Post.update(req.params.id, req.body);
    res.json({ post: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/posts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await Post.delete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/posts/:id/publish
router.post('/:id/publish', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const sites = WordPressService.getSites();
    const results = [];

    for (const site of sites) {
      try {
        const wpPost = await WordPressService.createPost(site, {
          title: post.title,
          content: post.content,
          status: 'publish',
        });
        results.push({ site: site.siteUrl, success: true, wpId: wpPost.id, url: wpPost.link });
      } catch (err) {
        results.push({ site: site.siteUrl, success: false, error: err.message });
      }
    }

    await Post.update(req.params.id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      metadata: { ...post.metadata, publishResults: results },
    });

    res.json({ message: 'Post published', results });
  } catch (error) {
    next(error);
  }
});

// POST /api/posts/:id/schedule
router.post('/:id/schedule', [
  body('scheduledAt').isISO8601().withMessage('Valid ISO date required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await Post.update(req.params.id, {
      status: 'scheduled',
      scheduledAt: req.body.scheduledAt,
    });

    res.json({ post: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
