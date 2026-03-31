const { getCollection } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../services/logger');

const COLLECTION = 'users';

class User {
  static async create({ email, password, name, role = 'free' }) {
    const col = getCollection(COLLECTION);

    const existing = await User.findByEmail(email);
    if (existing) {
      const err = new Error('Email already in use');
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      createdAt: now,
      updatedAt: now,
      stripeCustomerId: null,
      subscription: { plan: 'free', status: 'active' },
    };

    const ref = await col.add(userData);
    return { id: ref.id, ...userData, password: undefined };
  }

  static async findById(id) {
    const col = getCollection(COLLECTION);
    const doc = await col.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    delete data.password;
    return { id: doc.id, ...data };
  }

  static async findByEmail(email) {
    const col = getCollection(COLLECTION);
    const snapshot = await col.where('email', '==', email.toLowerCase()).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  static async update(id, updates) {
    const col = getCollection(COLLECTION);
    const data = { ...updates, updatedAt: new Date().toISOString() };
    await col.doc(id).update(data);
    return User.findById(id);
  }

  static async delete(id) {
    const col = getCollection(COLLECTION);
    await col.doc(id).delete();
    return true;
  }

  static async verifyPassword(email, password) {
    const user = await User.findByEmail(email);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  }
}

module.exports = User;
