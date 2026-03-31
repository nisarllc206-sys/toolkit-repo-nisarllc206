const logger = require('./logger');

let twilioClient;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    logger.info('Twilio client initialized');
  } else {
    logger.warn('Twilio credentials not set. WhatsApp features will not be available.');
  }
} catch (error) {
  logger.error('Failed to initialize Twilio:', error.message);
}

const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

class WhatsAppService {
  static async sendMessage(to, message) {
    if (!twilioClient) {
      logger.warn('WhatsApp message not sent - Twilio not configured');
      return null;
    }

    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await twilioClient.messages.create({
      body: message,
      from: FROM,
      to: toFormatted,
    });

    logger.info(`WhatsApp message sent to ${to}: SID ${result.sid}`);
    return result;
  }

  static async sendTemplateMessage(to, templateName, variables = {}) {
    if (!twilioClient) {
      logger.warn('WhatsApp template message not sent - Twilio not configured');
      return null;
    }

    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await twilioClient.messages.create({
      contentSid: templateName,
      contentVariables: JSON.stringify(variables),
      from: FROM,
      to: toFormatted,
    });

    return result;
  }

  static handleIncomingMessage(body) {
    const { From, Body, MessageSid } = body;
    logger.info(`Incoming WhatsApp from ${From}: ${Body} (SID: ${MessageSid})`);

    const text = (Body || '').trim().toLowerCase();

    if (text === 'help') {
      return { reply: 'Commands: STATUS - check your account, POSTS - recent posts, STOP - unsubscribe' };
    }

    if (text === 'status') {
      return { reply: 'Your account is active. Visit the dashboard for details.' };
    }

    return { reply: null };
  }
}

module.exports = WhatsAppService;
