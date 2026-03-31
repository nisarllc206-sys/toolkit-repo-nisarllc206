const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const WordPressService = require('../services/wordpress');
const { authMiddleware } = require('../middleware/auth');
const { db } = require('../config/firebase');
const logger = require('../services/logger');

router.use(authMiddleware);

// GET /api/wordpress/sites
router.get('/sites', async (req, res, next) => {
  try {
    if (!db) {
      const sites = WordPressService.getSites().map((s) => ({ ...s, applicationPassword: '***' }));
      return res.json({ sites });
    }

    const snapshot = await db.collection('wordpress_sites')
      .where('userId', '==', req.user.id).get();

    const sites = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, siteUrl: data.siteUrl, username: data.username, name: data.name };
    });

    res.json({ sites });
  } catch (error) {
    next(error);
  }
});

// POST /api/wordpress/sites
router.post('/sites', [
  body('siteUrl').isURL().withMessage('Valid site URL required'),
  body('username').trim().notEmpty(),
  body('applicationPassword').notEmpty(),
  body('name').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!db) return res.status(503).json({ error: 'Database not configured' });

    const { siteUrl, username, applicationPassword, name } = req.body;

    await WordPressService.getCategories({ siteUrl, username, applicationPassword });

    const ref = await db.collection('wordpress_sites').add({
      userId: req.user.id,
      siteUrl,
      username,
      applicationPassword,
      name: name || siteUrl,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ site: { id: ref.id, siteUrl, username, name: name || siteUrl } });
  } catch (error) {
    if (error.response) {
      return res.status(400).json({ error: 'Failed to connect to WordPress site. Check credentials.' });
    }
    next(error);
  }
});

// DELETE /api/wordpress/sites/:id
router.delete('/sites/:id', async (req, res, next) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not configured' });

    const doc = await db.collection('wordpress_sites').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Site not found' });
    if (doc.data().userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await db.collection('wordpress_sites').doc(req.params.id).delete();
    res.json({ message: 'Site removed' });
  } catch (error) {
    next(error);
  }
});

// POST /api/wordpress/publish
router.post('/publish', [
  body('siteId').notEmpty(),
  body('title').trim().notEmpty(),
  body('content').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!db) return res.status(503).json({ error: 'Database not configured' });

    const siteDoc = await db.collection('wordpress_sites').doc(req.body.siteId).get();
    if (!siteDoc.exists) return res.status(404).json({ error: 'Site not found' });
    if (siteDoc.data().userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const siteConfig = siteDoc.data();
    const result = await WordPressService.createPost(siteConfig, req.body);

    res.json({ success: true, post: { id: result.id, url: result.link } });
  } catch (error) {
    next(error);
  }
});

// GET /api/wordpress/categories
router.get('/categories', async (req, res, next) => {
  try {
    const { siteId } = req.query;
    if (!siteId) return res.status(400).json({ error: 'siteId query param required' });
    if (!db) return res.status(503).json({ error: 'Database not configured' });

    const siteDoc = await db.collection('wordpress_sites').doc(siteId).get();
    if (!siteDoc.exists) return res.status(404).json({ error: 'Site not found' });
    if (siteDoc.data().userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const categories = await WordPressService.getCategories(siteDoc.data());
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// GET /api/wordpress/tags
router.get('/tags', async (req, res, next) => {
  try {
    const { siteId } = req.query;
    if (!siteId) return res.status(400).json({ error: 'siteId query param required' });
    if (!db) return res.status(503).json({ error: 'Database not configured' });

    const siteDoc = await db.collection('wordpress_sites').doc(siteId).get();
    if (!siteDoc.exists) return res.status(404).json({ error: 'Site not found' });
    if (siteDoc.data().userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const tags = await WordPressService.getTags(siteDoc.data());
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
