const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, pdfContext, userMessage } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    switch (action) {
      case 'chat': {
        if (!pdfContext || !userMessage) {
          return res.status(400).json({ error: 'pdfContext and userMessage are required for chat' });
        }

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful PDF assistant. Answer questions based on the provided PDF content.'
            },
            {
              role: 'user',
              content: `PDF Context:\n${pdfContext}\n\nUser Question: ${userMessage}`
            }
          ],
          max_tokens: 2000
        });

        return res.status(200).json({
          success: true,
          response: completion.choices[0].message.content
        });
      }

      case 'summarize': {
        if (!pdfContext) {
          return res.status(400).json({ error: 'pdfContext is required for summarize' });
        }

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Summarize the provided PDF content concisely.'
            },
            { role: 'user', content: pdfContext }
          ],
          max_tokens: 1000
        });

        return res.status(200).json({
          success: true,
          summary: completion.choices[0].message.content
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('PDF Tools Error:', error);
    res.status(500).json({ error: 'PDF tool operation failed' });
  }
};
