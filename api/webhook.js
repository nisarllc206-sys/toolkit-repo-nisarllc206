const axios = require('axios');

const API_URL = 'https://graph.facebook.com/v18.0';

function verifyToken(token) {
  return token === process.env.VERIFY_TOKEN;
}

module.exports = async (req, res) => {
  // GET: Webhook verification
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (verifyToken(token)) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Unauthorized');
  }

  // POST: Receive messages
  if (req.method === 'POST') {
    try {
      const body = req.body;
      const entry = body.entry && body.entry[0];
      const changes = entry && entry.changes && entry.changes[0];
      const messages = changes && changes.value && changes.value.messages;

      if (!messages || !messages.length) {
        return res.status(200).json({ success: true });
      }

      const incomingMessage = messages[0];
      const from = incomingMessage.from;
      const text = incomingMessage.text?.body || '';

      // Auto-reply logic
      let replyText = '👋 Hello! Welcome to AI PDF Super Toolkit. How can I help you today?';
      if (text.toLowerCase().includes('pdf')) {
        replyText = '📄 I can help you with PDF tools! Visit our app to merge, split, compress, or chat with your PDFs.';
      } else if (text.toLowerCase().includes('help')) {
        replyText = '🤖 Available commands:\n- PDF tools\n- AI chat\n- Image convert\n- QR code\n\nReply with a keyword to learn more!';
      }

      // Send auto-reply
      await axios.post(
        `${API_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: from,
          type: 'text',
          text: { body: replyText }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook Error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
