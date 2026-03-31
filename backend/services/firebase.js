const { db } = require('../config/firebase');
const logger = require('./logger');

class FirebaseService {
  static async createDocument(collection, data) {
    if (!db) throw new Error('Firestore not initialized');
    const now = new Date().toISOString();
    const docData = { ...data, createdAt: data.createdAt || now, updatedAt: now };
    const ref = await db.collection(collection).add(docData);
    return { id: ref.id, ...docData };
  }

  static async getDocument(collection, id) {
    if (!db) throw new Error('Firestore not initialized');
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async updateDocument(collection, id, data) {
    if (!db) throw new Error('Firestore not initialized');
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    await db.collection(collection).doc(id).update(updateData);
    return FirebaseService.getDocument(collection, id);
  }

  static async deleteDocument(collection, id) {
    if (!db) throw new Error('Firestore not initialized');
    await db.collection(collection).doc(id).delete();
    return true;
  }

  static async queryDocuments(collection, filters = [], orderBy = null, limit = 50) {
    if (!db) throw new Error('Firestore not initialized');
    let query = db.collection(collection);

    for (const filter of filters) {
      query = query.where(filter.field, filter.operator || '==', filter.value);
    }

    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
    }

    if (limit) query = query.limit(limit);

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async getDocumentByField(collection, field, value) {
    const docs = await FirebaseService.queryDocuments(collection, [{ field, operator: '==', value }], null, 1);
    return docs[0] || null;
  }
}

module.exports = FirebaseService;
