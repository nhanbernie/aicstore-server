export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'wdp_server',
    // synchronize: process.env.NODE_ENV !== 'production', update migrate sau
    synchronize: true, 
    logging: process.env.NODE_ENV === 'development',
    ssl:
      process.env.DATABASE_HOST?.includes('neon.tech') ||
      process.env.DATABASE_HOST?.includes('aws.neon.tech')
        ? { rejectUnauthorized: false }
        : false,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-256-bits',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'your-super-secret-refresh-key-change-in-production-min-256-bits',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
});
