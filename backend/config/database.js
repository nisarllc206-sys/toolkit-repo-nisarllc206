const { db } = require('./firebase');
const logger = require('../services/logger');

const getCollection = (collectionName) => {
  if (!db) {
    throw new Error('Firestore is not initialized. Check Firebase configuration.');
  }
  return db.collection(collectionName);
};

const paginate = async (query, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();
  const total = (await query.get()).size;

  return {
    data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = { getCollection, paginate };
