const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const whatsappService = require('../services/whatsappService');

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Webhook GET (verification)
router.get('/webhook', webhookLimiter, (req, res) => {
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (whatsappService.verifyWebhook(token)) {
    res.send(challenge);
  } else {
    res.status(403).send('Unauthorized');
  }
});

// Webhook POST (receive messages)
router.post('/webhook', async (req, res) => {
  try {
    const messageData = await whatsappService.handleWebhook(req.body);
    res.json({ success: true, data: messageData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send text message
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message required' });
    }

    const result = await whatsappService.sendMessage(phoneNumber, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send media message
router.post('/send-media', async (req, res) => {
  try {
    const { phoneNumber, mediaType, mediaUrl, caption } = req.body;

    if (!phoneNumber || !mediaType || !mediaUrl) {
      return res.status(400).json({ error: 'phoneNumber, mediaType, and mediaUrl are required' });
    }

    const result = await whatsappService.sendMediaMessage(phoneNumber, mediaType, mediaUrl, caption);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
