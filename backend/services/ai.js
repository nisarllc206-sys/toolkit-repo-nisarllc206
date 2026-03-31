const OpenAI = require('openai');
const logger = require('./logger');

let openai;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logger.info('OpenAI client initialized');
  } else {
    logger.warn('OPENAI_API_KEY not set. AI features will not be available.');
  }
} catch (error) {
  logger.error('Failed to initialize OpenAI:', error.message);
}

class AIService {
  static async generateContent(prompt, type = 'blog', options = {}) {
    if (!openai) throw new Error('OpenAI is not configured');

    const systemPrompts = {
      blog: 'You are an expert blog writer. Create engaging, SEO-friendly blog posts with proper headings, subheadings, and clear structure.',
      social: 'You are a social media expert. Create engaging, concise posts optimized for social media engagement.',
      email: 'You are an email marketing specialist. Create compelling, personalized email content that drives action.',
      product: 'You are a copywriting expert. Create persuasive product descriptions that highlight benefits.',
    };

    const systemPrompt = systemPrompts[type] || systemPrompts.blog;
    const model = options.model || 'gpt-4';
    const maxTokens = options.maxTokens || 2000;
    const temperature = options.temperature || 0.7;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model,
    };
  }

  static async generateImage(prompt, options = {}) {
    if (!openai) throw new Error('OpenAI is not configured');

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
    });

    return {
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
    };
  }

  static async generateSEOMetadata(content) {
    if (!openai) throw new Error('OpenAI is not configured');

    const prompt = `Analyze the following content and generate SEO metadata. Return a JSON object with these fields:
    - title: SEO-optimized title (max 60 chars)
    - description: Meta description (max 160 chars)
    - keywords: Array of 5-10 relevant keywords
    - slug: URL-friendly slug

    Content:
    ${content.substring(0, 2000)}

    Return only valid JSON, no markdown.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch {
      logger.error('Failed to parse SEO metadata JSON');
      return { title: '', description: '', keywords: [], slug: '' };
    }
  }

  static async generateSocialPost(content, platform = 'twitter') {
    if (!openai) throw new Error('OpenAI is not configured');

    const limits = {
      twitter: '280 characters',
      facebook: '500 characters, engaging and shareable',
      instagram: 'caption with relevant hashtags, max 2200 characters',
      linkedin: 'professional tone, max 700 characters',
    };

    const prompt = `Create a ${platform} post from this content. Limit: ${limits[platform] || '300 characters'}.

    Content: ${content.substring(0, 1000)}

    Return only the post text, ready to publish.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.8,
    });

    return response.choices[0].message.content.trim();
  }
}

module.exports = AIService;
