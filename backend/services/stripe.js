const logger = require('./logger');

let stripe;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    logger.info('Stripe client initialized');
  } else {
    logger.warn('STRIPE_SECRET_KEY not set. Payment features will not be available.');
  }
} catch (error) {
  logger.error('Failed to initialize Stripe:', error.message);
}

class StripeService {
  static async createCustomer(email, name) {
    if (!stripe) throw new Error('Stripe is not configured');
    const customer = await stripe.customers.create({ email, name });
    return customer;
  }

  static async createSubscription(customerId, priceId) {
    if (!stripe) throw new Error('Stripe is not configured');
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  }

  static async cancelSubscription(subscriptionId) {
    if (!stripe) throw new Error('Stripe is not configured');
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  }

  static async createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
    if (!stripe) throw new Error('Stripe is not configured');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return session;
  }

  static handleWebhook(payload, signature) {
    if (!stripe) throw new Error('Stripe is not configured');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  }

  static async getSubscription(subscriptionId) {
    if (!stripe) throw new Error('Stripe is not configured');
    return stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'customer'],
    });
  }

  static async getPlans() {
    if (!stripe) {
      return [
        { id: 'free', name: 'Free', price: 0, features: ['5 AI generations/month', '1 WordPress site'] },
        { id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro', name: 'Pro', price: 29, features: ['100 AI generations/month', '5 WordPress sites', 'Social media posting'] },
        { id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise', name: 'Enterprise', price: 99, features: ['Unlimited AI generations', 'Unlimited WordPress sites', 'WhatsApp notifications', 'Priority support'] },
      ];
    }

    const prices = await stripe.prices.list({ active: true, expand: ['data.product'] });
    return prices.data;
  }
}

module.exports = StripeService;
