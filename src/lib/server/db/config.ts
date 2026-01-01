import { env } from '$env/dynamic/private';

// Environment configuration
export default {
  mongoUri: env.MONGODB_URI || 'mongodb://localhost:27017',
  jwtSecret: env.JWT_SECRET || 'casino-secret-key-change-in-production',
  jwtExpirySeconds: 60 * 60 * 24 * 7, // 7 days in seconds
  // Email configuration for 2FA
  email: {
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(env.SMTP_PORT || '587'),
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.SMTP_FROM || 'Gold Games <noreply@goldgames.com>',
  },
  twoFactorCodeExpiry: 5 * 60 * 1000, // 5 minutes in milliseconds
};
