const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_TOKEN;
    this.verifyToken = process.env.VERIFY_TOKEN;
  }

  async sendMessage(phoneNumber, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('WhatsApp Send Error:', error);
      throw error;
    }
  }

  async sendMediaMessage(phoneNumber, mediaType, mediaUrl, caption = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          ...(caption && { caption })
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      throw error;
    }
  }

  async handleWebhook(body) {
    try {
      const entry = body.entry && body.entry[0];
      const changes = entry && entry.changes && entry.changes[0];
      const messages = changes && changes.value && changes.value.messages;

      if (!messages || !messages.length) {
        return { success: true };
      }

      const incomingMessage = messages[0];

      return {
        success: true,
        from: incomingMessage.from,
        text: incomingMessage.text?.body || '',
        timestamp: incomingMessage.timestamp,
        messageId: incomingMessage.id
      };
    } catch (error) {
      console.error('Webhook Handler Error:', error);
      throw error;
    }
  }

  verifyWebhook(token) {
    return token === this.verifyToken;
  }
}

module.exports = new WhatsAppService();
