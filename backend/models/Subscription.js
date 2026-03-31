const { getCollection } = require('../config/database');

const COLLECTION = 'subscriptions';

class Subscription {
  static async create({ userId, stripeSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd }) {
    const col = getCollection(COLLECTION);
    const now = new Date().toISOString();

    const subData = {
      userId,
      stripeSubscriptionId,
      plan,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await col.add(subData);
    return { id: ref.id, ...subData };
  }

  static async findById(id) {
    const col = getCollection(COLLECTION);
    const doc = await col.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findByUser(userId) {
    const col = getCollection(COLLECTION);
    const snapshot = await col
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  static async findByStripeId(stripeSubscriptionId) {
    const col = getCollection(COLLECTION);
    const snapshot = await col
      .where('stripeSubscriptionId', '==', stripeSubscriptionId)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  static async update(id, updates) {
    const col = getCollection(COLLECTION);
    const data = { ...updates, updatedAt: new Date().toISOString() };
    await col.doc(id).update(data);
    return Subscription.findById(id);
  }
}

module.exports = Subscription;
