require('dotenv').config({ path: '../.env' });
const cron = require('node-cron');
const SocialMediaService = require('../backend/services/social-media');
const logger = require('../backend/services/logger');
const { db } = require('../backend/config/firebase');

async function processScheduledSocialPosts() {
  if (!db) {
    logger.warn('Firestore not available. Social scheduler inactive.');
    return;
  }

  logger.info('Checking for scheduled social posts...');

  try {
    const now = new Date().toISOString();
    const snapshot = await db
      .collection('scheduled_social_posts')
      .where('status', '==', 'pending')
      .where('scheduleTime', '<=', now)
      .limit(10)
      .get();

    if (snapshot.empty) {
      logger.info('No scheduled social posts');
      return;
    }

    for (const doc of snapshot.docs) {
      const post = { id: doc.id, ...doc.data() };

      try {
        let result;

        if (post.platform === 'facebook') {
          result = await SocialMediaService.publishToFacebook(
            post.content.pageId,
            post.content.accessToken,
            post.content.message,
            post.content.imageUrl
          );
        } else if (post.platform === 'instagram') {
          result = await SocialMediaService.publishToInstagram(
            post.content.accountId,
            post.content.accessToken,
            post.content.imageUrl,
            post.content.caption
          );
        }

        await db.collection('scheduled_social_posts').doc(doc.id).update({
          status: 'published',
          publishedAt: new Date().toISOString(),
          result,
        });

        logger.info(`Social post published to ${post.platform}: ${doc.id}`);
      } catch (error) {
        await db.collection('scheduled_social_posts').doc(doc.id).update({
          status: 'failed',
          error: error.message,
        });
        logger.error(`Failed social post ${doc.id}:`, error.message);
      }
    }
  } catch (error) {
    logger.error('Social scheduler error:', error.message);
  }
}

cron.schedule('*/10 * * * *', processScheduledSocialPosts);
logger.info('Social media scheduler started (every 10 minutes)');
processScheduledSocialPosts();
