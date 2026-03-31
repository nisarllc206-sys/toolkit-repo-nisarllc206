require('dotenv').config({ path: '../../.env' });
const { db } = require('../../backend/config/firebase');
const logger = require('../../backend/services/logger');

const SEED_TOOLS = [
  { name: 'ChatGPT', description: 'Advanced AI chatbot by OpenAI. Generate text, answer questions, write code, and more with GPT-4 and GPT-3.5.', category: 'Writing', url: 'https://chat.openai.com', isFree: true, rating: 4.9, tags: ['chatbot', 'writing', 'gpt-4', 'openai'] },
  { name: 'Midjourney', description: 'AI image generator creating stunning artistic visuals from text prompts. Discord-based with premium quality.', category: 'Image', url: 'https://midjourney.com', isFree: false, rating: 4.8, tags: ['image', 'art', 'design', 'discord'] },
  { name: 'DALL-E 3', description: 'OpenAI image generation model. Create photorealistic and artistic images from text descriptions via API or ChatGPT.', category: 'Image', url: 'https://openai.com/dall-e-3', isFree: false, rating: 4.7, tags: ['image', 'openai', 'api', 'generative'] },
  { name: 'Jasper AI', description: 'AI writing assistant for marketing copy, blog posts, and social media content at scale. Integrates with SEO tools.', category: 'Marketing', url: 'https://jasper.ai', isFree: false, rating: 4.7, tags: ['marketing', 'copywriting', 'content', 'seo'] },
  { name: 'ElevenLabs', description: 'High-quality AI voice cloning and text-to-speech with realistic voices in 29+ languages.', category: 'Audio', url: 'https://elevenlabs.io', isFree: true, rating: 4.8, tags: ['voice', 'tts', 'audio', 'cloning'] },
  { name: 'Runway ML', description: 'AI video generation and editing platform. Create and edit videos using AI with text-to-video generation.', category: 'Video', url: 'https://runwayml.com', isFree: true, rating: 4.6, tags: ['video', 'generation', 'editing', 'gen2'] },
  { name: 'Grammarly', description: 'AI-powered writing assistant that checks grammar, style, clarity, and tone. Browser extension and app.', category: 'Writing', url: 'https://grammarly.com', isFree: true, rating: 4.8, tags: ['grammar', 'writing', 'proofreading', 'style'] },
  { name: 'Copy.ai', description: 'AI copywriting tool for sales copy, email campaigns, social media posts, and marketing materials.', category: 'Marketing', url: 'https://copy.ai', isFree: true, rating: 4.5, tags: ['copywriting', 'marketing', 'sales', 'email'] },
  { name: 'Surfer SEO', description: 'AI-powered SEO content optimization tool. Analyze, write, and optimize content to rank higher.', category: 'SEO', url: 'https://surferseo.com', isFree: false, rating: 4.6, tags: ['seo', 'content', 'keywords', 'optimization'] },
  { name: 'GitHub Copilot', description: 'AI pair programmer that suggests code completions and entire functions in your IDE.', category: 'Code', url: 'https://github.com/features/copilot', isFree: false, rating: 4.7, tags: ['code', 'github', 'autocomplete', 'programming'] },
  { name: 'Stable Diffusion', description: 'Open-source image generation AI. Run locally for unlimited generations or use API integrations.', category: 'Image', url: 'https://stability.ai', isFree: true, rating: 4.5, tags: ['image', 'open-source', 'diffusion', 'free'] },
  { name: 'Notion AI', description: 'AI writing and summarization built into Notion. Generate content, summarize pages, and fix writing.', category: 'Productivity', url: 'https://notion.so', isFree: false, rating: 4.6, tags: ['productivity', 'writing', 'notes', 'workspace'] },
  { name: 'Synthesia', description: 'Create professional AI avatar videos for training, marketing, and presentations without cameras.', category: 'Video', url: 'https://synthesia.io', isFree: false, rating: 4.5, tags: ['video', 'avatar', 'presentation', 'training'] },
  { name: 'Semrush', description: 'Comprehensive SEO and content marketing platform with AI writing assistant and keyword research.', category: 'SEO', url: 'https://semrush.com', isFree: false, rating: 4.7, tags: ['seo', 'marketing', 'analytics', 'keywords'] },
  { name: 'Claude', description: "Anthropic's AI assistant for writing, analysis, coding, and research. Long context, thoughtful responses.", category: 'Writing', url: 'https://claude.ai', isFree: true, rating: 4.8, tags: ['chatbot', 'writing', 'analysis', 'anthropic'] },
  { name: 'Perplexity AI', description: 'AI-powered search engine providing sourced answers and real-time research summaries.', category: 'Productivity', url: 'https://perplexity.ai', isFree: true, rating: 4.7, tags: ['search', 'research', 'ai', 'sourced'] },
];

const SEED_TEMPLATES = [
  { name: 'SEO Blog Post', type: 'blog', prompt: 'Write a comprehensive, SEO-optimized blog post about {topic}. Include: compelling H1 title, introduction with hook, 3-5 H2 sections with H3 subsections, bullet points, actionable tips, and conclusion with CTA. Target keyword density 1-2%.', variables: ['topic'] },
  { name: 'Product Description', type: 'product', prompt: 'Write a persuasive product description for {product_name}. Include: attention-grabbing headline, key benefits (not just features), social proof elements, and a strong call-to-action. Target audience: {target_audience}.', variables: ['product_name', 'target_audience'] },
  { name: 'Email Newsletter', type: 'email', prompt: 'Create an email newsletter about {topic} for {company_name}. Include: subject line (50 chars max), preview text, engaging opening, 3 main sections with value, and clear CTA button text.', variables: ['topic', 'company_name'] },
  { name: 'Social Media Campaign', type: 'social', prompt: 'Create a 5-post social media campaign for {campaign_goal}. Include posts for: awareness, education, social proof, engagement, and conversion. Platform: {platform}.', variables: ['campaign_goal', 'platform'] },
  { name: 'YouTube Script', type: 'blog', prompt: 'Write a YouTube video script about {topic}. Include: hook (first 30 seconds), intro, 3-5 main points with examples, outro with subscribe CTA. Target length: {duration} minutes.', variables: ['topic', 'duration'] },
];

async function seed() {
  if (!db) {
    logger.error('Firestore not initialized. Check Firebase credentials in .env');
    process.exit(1);
  }

  logger.info('Starting database seed...');

  // Seed tools
  logger.info(`Seeding ${SEED_TOOLS.length} tools...`);
  const toolsCol = db.collection('tools');
  const toolBatch = db.batch();
  const now = new Date().toISOString();

  for (const tool of SEED_TOOLS) {
    const ref = toolsCol.doc();
    toolBatch.set(ref, { ...tool, usageCount: 0, ratingCount: 1, createdAt: now });
  }

  await toolBatch.commit();
  logger.info('Tools seeded successfully');

  // Seed templates
  logger.info(`Seeding ${SEED_TEMPLATES.length} content templates...`);
  const templateCol = db.collection('content_templates');
  const templateBatch = db.batch();

  for (const template of SEED_TEMPLATES) {
    const ref = templateCol.doc();
    templateBatch.set(ref, { ...template, isDefault: true, usageCount: 0, createdAt: now });
  }

  await templateBatch.commit();
  logger.info('Templates seeded successfully');

  logger.info('✅ Database seed complete!');
}

seed().catch((err) => {
  logger.error('Seed failed:', err.message);
  process.exit(1);
});
