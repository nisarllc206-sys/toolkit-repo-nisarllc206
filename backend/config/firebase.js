const admin = require('firebase-admin');
const logger = require('../services/logger');

let db;

try {
  if (!admin.apps.length) {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      logger.warn('Firebase credentials not fully configured. Firestore will not be available.');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      logger.info('Firebase Admin SDK initialized successfully');
    }
  }

  db = admin.apps.length ? admin.firestore() : null;
} catch (error) {
  logger.error('Failed to initialize Firebase:', error.message);
  db = null;
}

module.exports = { admin, db };
