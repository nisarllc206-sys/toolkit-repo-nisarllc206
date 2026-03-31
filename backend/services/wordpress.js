const axios = require('axios');
const logger = require('./logger');

class WordPressService {
  static getSites() {
    try {
      return JSON.parse(process.env.WORDPRESS_SITES || '[]');
    } catch {
      logger.warn('Invalid WORDPRESS_SITES env var. Should be a JSON array.');
      return [];
    }
  }

  static buildAuthHeader(siteConfig) {
    const credentials = Buffer.from(
      `${siteConfig.username}:${siteConfig.applicationPassword}`
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  static async createPost(siteConfig, postData) {
    const { siteUrl } = siteConfig;
    const url = `${siteUrl}/wp-json/wp/v2/posts`;

    const payload = {
      title: postData.title,
      content: postData.content,
      status: postData.status || 'draft',
      categories: postData.categories || [],
      tags: postData.tags || [],
      slug: postData.slug,
      excerpt: postData.excerpt,
      meta: postData.meta || {},
    };

    if (postData.featuredMediaId) {
      payload.featured_media = postData.featuredMediaId;
    }

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: WordPressService.buildAuthHeader(siteConfig),
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    logger.info(`Post created on WordPress site ${siteUrl}: ID ${response.data.id}`);
    return response.data;
  }

  static async uploadMedia(siteConfig, imageBuffer, filename, mimeType = 'image/jpeg') {
    const { siteUrl } = siteConfig;
    const url = `${siteUrl}/wp-json/wp/v2/media`;

    const response = await axios.post(url, imageBuffer, {
      headers: {
        Authorization: WordPressService.buildAuthHeader(siteConfig),
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      timeout: 60000,
    });

    return response.data;
  }

  static async getCategories(siteConfig) {
    const { siteUrl } = siteConfig;
    const url = `${siteUrl}/wp-json/wp/v2/categories?per_page=100`;

    const response = await axios.get(url, {
      headers: { Authorization: WordPressService.buildAuthHeader(siteConfig) },
      timeout: 15000,
    });

    return response.data;
  }

  static async getTags(siteConfig) {
    const { siteUrl } = siteConfig;
    const url = `${siteUrl}/wp-json/wp/v2/tags?per_page=100`;

    const response = await axios.get(url, {
      headers: { Authorization: WordPressService.buildAuthHeader(siteConfig) },
      timeout: 15000,
    });

    return response.data;
  }

  static async updatePost(siteConfig, postId, updates) {
    const { siteUrl } = siteConfig;
    const url = `${siteUrl}/wp-json/wp/v2/posts/${postId}`;

    const response = await axios.put(url, updates, {
      headers: {
        Authorization: WordPressService.buildAuthHeader(siteConfig),
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return response.data;
  }
}

module.exports = WordPressService;
