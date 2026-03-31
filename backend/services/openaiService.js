const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class OpenAIService {
  async generateCode(prompt, model = 'gpt-4', maxTokens = 4000) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert code generator for Android, Web, and Backend applications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      });

      return {
        success: true,
        code: completion.choices[0].message.content,
        usage: completion.usage
      };
    } catch (error) {
      console.error('OpenAI Error:', error);
      throw new Error(`Code generation failed: ${error.message}`);
    }
  }

  async chatWithPDF(userMessage, pdfContext) {
    try {
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

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Chat Error:', error);
      throw error;
    }
  }

  async generateDescription(changes) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Generate clear, concise pull request descriptions.'
          },
          {
            role: 'user',
            content: `Generate a PR description for these changes:\n${changes}`
          }
        ],
        max_tokens: 500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Description Error:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();
