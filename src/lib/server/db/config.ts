// Environment configuration
export default {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  jwtSecret: process.env.JWT_SECRET || 'casino-secret-key-change-in-production',
  jwtExpirySeconds: 60 * 60 * 24 * 7, // 7 days in seconds
};
