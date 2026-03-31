const { getCollection, paginate } = require('../config/database');

const COLLECTION = 'posts';

class Post {
  static async create({ userId, title, content, status = 'draft', platforms = [], wordpressSiteId = null, scheduledAt = null, metadata = {} }) {
    const col = getCollection(COLLECTION);
    const now = new Date().toISOString();

    const postData = {
      userId,
      title,
      content,
      status,
      platforms,
      wordpressSiteId,
      scheduledAt,
      publishedAt: null,
      metadata,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await col.add(postData);
    return { id: ref.id, ...postData };
  }

  static async findById(id) {
    const col = getCollection(COLLECTION);
    const doc = await col.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findByUser(userId, page = 1, limit = 20) {
    const col = getCollection(COLLECTION);
    const query = col.where('userId', '==', userId).orderBy('createdAt', 'desc');
    return paginate(query, page, limit);
  }

  static async update(id, updates) {
    const col = getCollection(COLLECTION);
    const data = { ...updates, updatedAt: new Date().toISOString() };
    await col.doc(id).update(data);
    return Post.findById(id);
  }

  static async delete(id) {
    const col = getCollection(COLLECTION);
    await col.doc(id).delete();
    return true;
  }

  static async findScheduled(before = new Date().toISOString()) {
    const col = getCollection(COLLECTION);
    const snapshot = await col
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', before)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = Post;
