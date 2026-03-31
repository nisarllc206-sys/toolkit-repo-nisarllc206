'use strict';

const axios = require('axios');
const OpenAI = require('openai');

// ─── Constants ────────────────────────────────────────────────────────────────

const WHATSAPP_PHONE = '923408060167';
const WHATSAPP_CONTACT_LINK = `https://wa.me/${WHATSAPP_PHONE}`;
const WHATSAPP_MESSAGE_LINK = 'https://wa.me/message/3A7MFOQTRE2ZL1/';
const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;   // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;        // max outbound messages per window

// ─── Simple in-process stores ─────────────────────────────────────────────────

/** @type {Map<string, { count: number; windowStart: number }>} */
const rateLimitMap = new Map();

/** @type {Array<{ id: string; to: string; message: string; addedAt: number; attempts: number }>} */
const messageQueue = [];

let isProcessingQueue = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate a phone number string.
 * Accepts Pakistani local format (03xxxxxxxxx) and E.164 (+92xxxxxxxxxx / 92xxxxxxxxxx).
 * Returns the E.164 numeric string (without leading "+") on success, or null on failure.
 * @param {string} phone
 * @returns {string|null}
 */
function validatePhoneNumber(phone) {
  if (typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[\s\-().+]/g, '');

  // Pakistani local: 03xxxxxxxxx (11 digits)
  if (/^03\d{9}$/.test(cleaned)) {
    return '92' + cleaned.slice(1);
  }

  // E.164 with country code: 92xxxxxxxxxx (12 digits)
  if (/^92\d{10}$/.test(cleaned)) {
    return cleaned;
  }

  // Generic E.164 (1–15 digits after optional country code)
  if (/^\d{7,15}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Check whether sending to `recipientPhone` is within rate limits.
 * Returns true when allowed, false when the limit has been reached.
 * @param {string} recipientPhone
 * @returns {boolean}
 */
function checkRateLimit(recipientPhone) {
  const now = Date.now();
  const entry = rateLimitMap.get(recipientPhone);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(recipientPhone, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Lightweight structured logger.
 * @param {'info'|'warn'|'error'} level
 * @param {string} message
 * @param {object} [meta]
 */
function log(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: 'WhatsAppService',
    message,
    ...meta,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ─── WhatsApp Service ─────────────────────────────────────────────────────────

class WhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.PHONE_NUMBER_ID;
    this.apiBase = WHATSAPP_API_BASE;

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // ── Contact links ──────────────────────────────────────────────────────────

  /**
   * Return the wa.me contact link for the configured phone number.
   * @param {string} [prefilledText] Optional pre-filled message text.
   * @returns {string}
   */
  getContactLink(prefilledText) {
    if (prefilledText) {
      return `${WHATSAPP_CONTACT_LINK}?text=${encodeURIComponent(prefilledText)}`;
    }
    return WHATSAPP_CONTACT_LINK;
  }

  /**
   * Return the WhatsApp short-link for the business account.
   * @returns {string}
   */
  getMessageLink() {
    return WHATSAPP_MESSAGE_LINK;
  }

  /**
   * Return both link variants together.
   * @returns {{ contactLink: string; messageLink: string; phone: string }}
   */
  getLinkInfo() {
    return {
      phone: WHATSAPP_PHONE,
      contactLink: WHATSAPP_CONTACT_LINK,
      messageLink: WHATSAPP_MESSAGE_LINK,
    };
  }

  // ── Sending ────────────────────────────────────────────────────────────────

  /**
   * Send a plain-text WhatsApp message immediately.
   * @param {string} toPhone  Recipient phone (any supported format).
   * @param {string} message  Message body.
   * @returns {Promise<object>}
   */
  async sendMessage(toPhone, message) {
    const e164 = validatePhoneNumber(toPhone);
    if (!e164) {
      throw new Error(`Invalid phone number: "${toPhone}"`);
    }

    if (!checkRateLimit(e164)) {
      throw new Error(`Rate limit exceeded for ${e164}`);
    }

    try {
      const response = await axios.post(
        `${this.apiBase}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: e164,
          type: 'text',
          text: { body: message, preview_url: false },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      log('info', 'Message sent', { to: e164, messageId: response.data?.messages?.[0]?.id });
      return response.data;
    } catch (err) {
      log('error', 'Failed to send message', {
        to: e164,
        error: err.response?.data || err.message,
      });
      throw err;
    }
  }

  // ── Message queue ──────────────────────────────────────────────────────────

  /**
   * Enqueue a message for background delivery.
   * @param {string} toPhone
   * @param {string} message
   * @returns {string} Queue item ID
   */
  enqueueMessage(toPhone, message) {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    messageQueue.push({ id, to: toPhone, message, addedAt: Date.now(), attempts: 0 });
    log('info', 'Message enqueued', { id, to: toPhone });
    this._processQueue();
    return id;
  }

  /**
   * Drain the message queue asynchronously with simple retry logic.
   * @private
   */
  async _processQueue() {
    // Atomic-style guard: skip if already processing
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    try {
      while (messageQueue.length > 0) {
        const item = messageQueue[0];
        item.attempts += 1;

        try {
          await this.sendMessage(item.to, item.message);
          messageQueue.shift();
          log('info', 'Queued message delivered', { id: item.id, attempts: item.attempts });
        } catch (err) {
          log('warn', 'Queued message delivery failed', { id: item.id, attempts: item.attempts, error: err.message });

          if (item.attempts >= 3) {
            log('error', 'Dropping message after max retries', { id: item.id });
            messageQueue.shift();
          } else {
            // Exponential back-off: 1s, 2s for attempts 1 and 2
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, item.attempts - 1)));
          }
        }
      }
    } finally {
      isProcessingQueue = false;
    }
  }

  // ── AI response generation ─────────────────────────────────────────────────

  /**
   * Generate a concise AI reply suitable for WhatsApp.
   * @param {string} userMessage
   * @returns {Promise<string>}
   */
  async generateAIResponse(userMessage) {
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful AI PDF Toolkit assistant. ' +
              'Keep replies concise (under 300 characters) and focused on PDF tools, AI features, or general support.',
          },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty AI response');
      return content.trim();
    } catch (err) {
      log('error', 'AI response generation failed', { error: err.message });
      return 'Sorry, I could not process your request right now. Please try again later.';
    }
  }

  // ── Webhook processing ─────────────────────────────────────────────────────

  /**
   * Verify a WhatsApp webhook GET challenge.
   * @param {string} mode
   * @param {string} token
   * @param {string} challenge
   * @returns {string|null} The challenge string if verified, otherwise null.
   */
  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'nisar_verify';
    if (mode === 'subscribe' && token === verifyToken) {
      log('info', 'Webhook verified successfully');
      return challenge;
    }
    log('warn', 'Webhook verification failed', { mode, token });
    return null;
  }

  /**
   * Handle an incoming webhook POST payload.
   * Extracts the first text message, generates an AI reply, and sends it back.
   * @param {object} payload  Parsed request body from Meta/WhatsApp.
   * @returns {Promise<{ success: boolean; sender?: string; reply?: string } | null>}
   */
  async handleWebhook(payload) {
    try {
      const changes = payload?.entry?.[0]?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        log('info', 'Webhook received with no messages');
        return null;
      }

      const message = messages[0];
      const sender = message?.from;
      const text = message?.text?.body;

      if (!sender || !text) {
        log('info', 'Ignoring non-text or malformed message', { sender, hasText: !!text });
        return null;
      }

      log('info', 'Incoming WhatsApp message', { sender, preview: text.slice(0, 80) });

      const reply = await this.generateAIResponse(text);
      await this.sendMessage(sender, reply);

      log('info', 'Webhook handled', { sender, replyPreview: reply.slice(0, 80) });
      return { success: true, sender, reply };
    } catch (err) {
      log('error', 'Webhook processing error', { error: err.message });
      throw err;
    }
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = WhatsAppService;
module.exports.validatePhoneNumber = validatePhoneNumber;
module.exports.WHATSAPP_CONTACT_LINK = WHATSAPP_CONTACT_LINK;
module.exports.WHATSAPP_MESSAGE_LINK = WHATSAPP_MESSAGE_LINK;
module.exports.WHATSAPP_PHONE = WHATSAPP_PHONE;
