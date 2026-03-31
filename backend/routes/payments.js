const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const StripeService = require('../services/stripe');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const EmailService = require('../services/email');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../services/logger');

// GET /api/payments/plans
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await StripeService.getPlans();
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/checkout
router.post('/checkout', authMiddleware, [
  body('priceId').notEmpty().withMessage('Price ID is required'),
  body('successUrl').isURL(),
  body('cancelUrl').isURL(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = await User.findById(req.user.id);
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await StripeService.createCustomer(user.email, user.name);
      customerId = customer.id;
      await User.update(req.user.id, { stripeCustomerId: customerId });
    }

    const session = await StripeService.createCheckoutSession(
      customerId,
      req.body.priceId,
      req.body.successUrl,
      req.body.cancelUrl
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/webhook (no auth - uses Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = StripeService.handleWebhook(req.body, signature);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const existingSub = await Subscription.findByStripeId(sub.id);

        const subData = {
          stripeSubscriptionId: sub.id,
          plan: sub.metadata.plan || 'pro',
          status: sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };

        if (existingSub) {
          await Subscription.update(existingSub.id, subData);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const existingSub = await Subscription.findByStripeId(sub.id);
        if (existingSub) {
          await Subscription.update(existingSub.id, { status: 'canceled' });
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        logger.info(`Checkout completed: ${session.id}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/payments/subscription
router.get('/subscription', authMiddleware, async (req, res, next) => {
  try {
    const subscription = await Subscription.findByUser(req.user.id);
    res.json({ subscription: subscription || { plan: 'free', status: 'active' } });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/subscription/cancel
router.post('/subscription/cancel', authMiddleware, async (req, res, next) => {
  try {
    const subscription = await Subscription.findByUser(req.user.id);
    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const updated = await StripeService.cancelSubscription(subscription.stripeSubscriptionId);
    await Subscription.update(subscription.id, { cancelAtPeriodEnd: true });

    res.json({ message: 'Subscription will be canceled at period end', subscription: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
