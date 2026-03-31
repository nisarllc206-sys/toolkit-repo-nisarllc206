const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, platform } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const enhancedPrompt = `Generate production-ready ${platform || 'application'} code:\n${prompt}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code generator for Android, Web, and Backend applications.'
        },
        { role: 'user', content: enhancedPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    res.status(200).json({
      success: true,
      code: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: 'Code generation failed' });
  }
};
