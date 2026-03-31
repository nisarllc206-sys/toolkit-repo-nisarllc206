require('dotenv').config({ path: '../.env' });
const cron = require('node-cron');
const Post = require('../backend/models/Post');
const WordPressService = require('../backend/services/wordpress');
const WhatsAppService = require('../backend/services/whatsapp');
const logger = require('../backend/services/logger');

const MAX_RETRIES = 3;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function publishPostWithRetry(post, site, retries = 0) {
  try {
    const result = await WordPressService.createPost(site, {
      title: post.title,
      content: post.content,
      status: 'publish',
      metadata: post.metadata,
    });

    await Post.update(post.id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      metadata: { ...post.metadata, wpPostId: result.id, wpUrl: result.link },
    });

    logger.info(`Published post "${post.title}" to ${site.siteUrl}`);

    if (process.env.WHATSAPP_NOTIFY_TO) {
      await WhatsAppService.sendMessage(
        process.env.WHATSAPP_NOTIFY_TO,
        `✅ Post published!\n"${post.title}"\n${result.link}`
      ).catch(() => {});
    }

    return result;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      const delay = Math.pow(2, retries) * 1000;
      logger.warn(`Retry ${retries + 1}/${MAX_RETRIES} for post "${post.title}" in ${delay}ms`);
      await sleep(delay);
      return publishPostWithRetry(post, site, retries + 1);
    }

    await Post.update(post.id, {
      metadata: { ...post.metadata, lastError: error.message },
    }).catch(() => {});

    if (process.env.WHATSAPP_NOTIFY_TO) {
      await WhatsAppService.sendMessage(
        process.env.WHATSAPP_NOTIFY_TO,
        `❌ Failed to publish "${post.title}": ${error.message}`
      ).catch(() => {});
    }

    throw error;
  }
}

async function processScheduledPosts() {
  logger.info('Checking for scheduled posts...');

  try {
    const posts = await Post.findScheduled();
    if (!posts.length) {
      logger.info('No scheduled posts to process');
      return;
    }

    logger.info(`Found ${posts.length} scheduled posts`);
    const sites = WordPressService.getSites();

    for (const post of posts) {
      for (const site of sites) {
        try {
          await publishPostWithRetry(post, site);
        } catch (error) {
          logger.error(`Failed to publish post ${post.id}:`, error.message);
        }
      }
    }
  } catch (error) {
    logger.error('Error processing scheduled posts:', error.message);
  }
}

const schedule = process.env.POST_SCHEDULE || '*/5 * * * *';
cron.schedule(schedule, processScheduledPosts);

logger.info(`WordPress auto-post scheduler started (${schedule})`);

processScheduledPosts();
