require('dotenv').config({ path: '../.env' });
const cron = require('node-cron');
const WhatsAppService = require('../backend/services/whatsapp');
const EmailService = require('../backend/services/email');
const logger = require('../backend/services/logger');
const { db } = require('../backend/config/firebase');

async function processNotificationQueue() {
  if (!db) {
    logger.warn('Firestore not available. Notification sender inactive.');
    return;
  }

  const snapshot = await db
    .collection('notification_queue')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .limit(20)
    .get();

  if (snapshot.empty) return;

  for (const doc of snapshot.docs) {
    const notification = { id: doc.id, ...doc.data() };

    try {
      if (notification.channel === 'whatsapp' && notification.to && notification.message) {
        await WhatsAppService.sendMessage(notification.to, notification.message);
      } else if (notification.channel === 'email' && notification.to) {
        switch (notification.type) {
          case 'welcome':
            await EmailService.sendWelcomeEmail(notification.to, notification.data.name);
            break;
          case 'post_published':
            await EmailService.sendPostPublishedNotification(notification.to, notification.data.title, notification.data.url);
            break;
          case 'subscription':
            await EmailService.sendSubscriptionConfirmation(notification.to, notification.data.plan);
            break;
          default:
            await EmailService.send(notification.to, notification.subject, notification.html);
        }
      }

      await db.collection('notification_queue').doc(doc.id).update({
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      await db.collection('notification_queue').doc(doc.id).update({
        status: 'failed',
        error: error.message,
      });
      logger.error(`Notification ${doc.id} failed:`, error.message);
    }
  }
}

cron.schedule('*/2 * * * *', processNotificationQueue);
logger.info('Notification sender started (every 2 minutes)');
processNotificationQueue();
