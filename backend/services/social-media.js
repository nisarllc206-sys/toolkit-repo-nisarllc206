const axios = require('axios');
const logger = require('./logger');

const META_GRAPH_URL = 'https://graph.facebook.com/v18.0';

class SocialMediaService {
  static async publishToFacebook(pageId, accessToken, message, imageUrl = null) {
    let url = `${META_GRAPH_URL}/${pageId}/feed`;
    const payload = { message, access_token: accessToken };

    if (imageUrl) {
      url = `${META_GRAPH_URL}/${pageId}/photos`;
      payload.url = imageUrl;
      payload.caption = message;
    }

    const response = await axios.post(url, payload);
    logger.info(`Published to Facebook page ${pageId}: ${response.data.id}`);
    return response.data;
  }

  static async publishToInstagram(accountId, accessToken, imageUrl, caption) {
    const containerResponse = await axios.post(
      `${META_GRAPH_URL}/${accountId}/media`,
      { image_url: imageUrl, caption, access_token: accessToken }
    );

    const creationId = containerResponse.data.id;

    await new Promise((r) => setTimeout(r, 3000));

    const publishResponse = await axios.post(
      `${META_GRAPH_URL}/${accountId}/media_publish`,
      { creation_id: creationId, access_token: accessToken }
    );

    logger.info(`Published to Instagram account ${accountId}: ${publishResponse.data.id}`);
    return publishResponse.data;
  }

  static async getPageInsights(pageId, accessToken, metrics = ['page_views_total', 'page_fans']) {
    const metricsStr = metrics.join(',');
    const response = await axios.get(
      `${META_GRAPH_URL}/${pageId}/insights`,
      { params: { metric: metricsStr, access_token: accessToken } }
    );
    return response.data;
  }

  static async schedulePost(platform, content, scheduleTime) {
    const { db } = require('../config/firebase');
    if (!db) throw new Error('Firestore not initialized');

    const doc = await db.collection('scheduled_social_posts').add({
      platform,
      content,
      scheduleTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return { id: doc.id, platform, scheduleTime };
  }
}

module.exports = SocialMediaService;
