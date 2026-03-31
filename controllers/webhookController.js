'use strict';

const WhatsAppService = require('../services/whatsappService');

const whatsapp = new WhatsAppService();

/**
 * GET /api/whatsapp/webhook
 * Verify the webhook subscription from Meta.
 */
async function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = whatsapp.verifyWebhook(mode, token, challenge);
  if (result !== null) {
    return res.status(200).send(result);
  }
  return res.status(403).json({ error: 'Webhook verification failed' });
}

/**
 * POST /api/whatsapp/webhook
 * Receive and process incoming WhatsApp messages.
 */
async function handleWebhook(req, res) {
  // Acknowledge immediately so Meta doesn't retry
  res.status(200).json({ status: 'received' });

  try {
    const result = await whatsapp.handleWebhook(req.body);
    if (result) {
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: 'info',
          controller: 'webhookController',
          message: 'Interaction logged',
          sender: result.sender,
          replyPreview: result.reply?.slice(0, 80),
        })
      );
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'error',
        controller: 'webhookController',
        message: 'Webhook handler error',
        error: err.message,
      })
    );
  }
}

/**
 * GET /api/whatsapp/contact
 * Return the WhatsApp contact links for the business number.
 */
function getContactLink(req, res) {
  const { text } = req.query;
  const info = whatsapp.getLinkInfo();

  return res.status(200).json({
    phone: info.phone,
    contactLink: text
      ? whatsapp.getContactLink(String(text))
      : info.contactLink,
    messageLink: info.messageLink,
  });
}

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message (enqueued for resilient delivery).
 * Body: { to: string, message: string }
 */
async function sendMessage(req, res) {
  const { to, message } = req.body || {};

  if (!to || !message) {
    return res.status(400).json({ error: '`to` and `message` are required' });
  }

  try {
    const queueId = whatsapp.enqueueMessage(String(to), String(message));
    return res.status(202).json({ status: 'queued', queueId });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  verifyWebhook,
  handleWebhook,
  getContactLink,
  sendMessage,
};
