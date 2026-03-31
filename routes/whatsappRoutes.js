'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  verifyWebhook,
  handleWebhook,
  getContactLink,
  sendMessage,
} = require('../controllers/webhookController');

// ─── Rate limiters ─────────────────────────────────────────────────────────
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 20,               // max requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const webhookVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/**
 * GET /api/whatsapp/contact
 * Returns the WhatsApp contact link and message link for the business number.
 * Query param: ?text=<pre-filled message>
 *
 * Example response:
 * {
 *   "phone": "923408060167",
 *   "contactLink": "https://wa.me/923408060167",
 *   "messageLink": "https://wa.me/message/3A7MFOQTRE2ZL1/"
 * }
 */
router.get('/contact', getContactLink);

/**
 * GET /api/whatsapp/webhook
 * Webhook verification endpoint used by Meta during initial setup.
 * Query params: hub.mode, hub.verify_token, hub.challenge
 */
router.get('/webhook', webhookVerifyLimiter, verifyWebhook);

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp message events from Meta.
 * Responds 200 immediately; processing happens asynchronously.
 */
router.post('/webhook', handleWebhook);

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message to a given phone number.
 * Body: { "to": "923408060167", "message": "Hello!" }
 *
 * Example response:
 * { "status": "queued", "queueId": "msg_1234567890_abcdef" }
 */
router.post('/send', sendLimiter, sendMessage);

module.exports = router;
