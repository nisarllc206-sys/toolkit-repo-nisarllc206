const { getCollection, paginate } = require('../config/database');

const COLLECTION = 'tools';

class Tool {
  static async create({ name, description, category, url, isFree = true, tags = [] }) {
    const col = getCollection(COLLECTION);
    const now = new Date().toISOString();

    const toolData = {
      name,
      description,
      category,
      url,
      isFree,
      rating: 0,
      usageCount: 0,
      tags,
      createdAt: now,
    };

    const ref = await col.add(toolData);
    return { id: ref.id, ...toolData };
  }

  static async findById(id) {
    const col = getCollection(COLLECTION);
    const doc = await col.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findAll({ category, isFree, page = 1, limit = 20 } = {}) {
    const col = getCollection(COLLECTION);
    let query = col.orderBy('usageCount', 'desc');

    if (category) query = query.where('category', '==', category);
    if (isFree !== undefined) query = query.where('isFree', '==', isFree);

    return paginate(query, page, limit);
  }

  static async update(id, updates) {
    const col = getCollection(COLLECTION);
    await col.doc(id).update(updates);
    return Tool.findById(id);
  }

  static async delete(id) {
    const col = getCollection(COLLECTION);
    await col.doc(id).delete();
    return true;
  }

  static async rate(id, rating) {
    const col = getCollection(COLLECTION);
    const doc = await col.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    const newRating = ((data.rating || 0) * (data.ratingCount || 0) + rating) / ((data.ratingCount || 0) + 1);
    await col.doc(id).update({
      rating: Math.round(newRating * 10) / 10,
      ratingCount: (data.ratingCount || 0) + 1,
    });
    return Tool.findById(id);
  }

  static async incrementUsage(id) {
    const col = getCollection(COLLECTION);
    const { admin } = require('../config/firebase');
    await col.doc(id).update({
      usageCount: admin.firestore.FieldValue.increment(1),
    });
  }
}

module.exports = Tool;
