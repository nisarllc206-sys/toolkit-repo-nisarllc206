const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    logger.info('Email transporter initialized');
  } else {
    logger.warn('EMAIL_USER/EMAIL_PASSWORD not set. Email features will not be available.');
  }
} catch (error) {
  logger.error('Failed to initialize email transporter:', error.message);
}

const FROM = process.env.EMAIL_FROM || `AI Creator SaaS <${process.env.EMAIL_USER}>`;
const APP_URL = process.env.APP_URL || 'https://your-app.com';

class EmailService {
  static async send(to, subject, html) {
    if (!transporter) {
      logger.warn(`Email not sent to ${to} - transporter not configured`);
      return null;
    }

    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  }

  static async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to AI Creator SaaS! 🚀';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h1 style="color:#6750A4">Welcome, ${name}!</h1>
        <p>Your account is ready. Start creating AI-powered content today.</p>
        <a href="${APP_URL}/dashboard" style="background:#6750A4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;margin:16px 0">Go to Dashboard</a>
        <p>Need help? Reply to this email or visit our <a href="${APP_URL}/docs">documentation</a>.</p>
        <p style="color:#666;font-size:12px">© AI Creator SaaS</p>
      </div>`;
    return EmailService.send(email, subject, html);
  }

  static async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h1 style="color:#6750A4">Reset Your Password</h1>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="background:#6750A4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;margin:16px 0">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>`;
    return EmailService.send(email, subject, html);
  }

  static async sendSubscriptionConfirmation(email, plan) {
    const subject = `Subscription Confirmed: ${plan} Plan`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h1 style="color:#6750A4">Subscription Confirmed! 🎉</h1>
        <p>Your <strong>${plan}</strong> plan is now active.</p>
        <a href="${APP_URL}/dashboard" style="background:#6750A4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;margin:16px 0">Start Using Features</a>
      </div>`;
    return EmailService.send(email, subject, html);
  }

  static async sendPostPublishedNotification(email, postTitle, url) {
    const subject = `Post Published: ${postTitle}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h1 style="color:#6750A4">Post Published! ✅</h1>
        <p>Your post "<strong>${postTitle}</strong>" is now live.</p>
        <a href="${url}" style="background:#6750A4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;margin:16px 0">View Post</a>
      </div>`;
    return EmailService.send(email, subject, html);
  }
}

module.exports = EmailService;
