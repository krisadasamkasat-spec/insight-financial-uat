const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Support both DATABASE_URL (Railway) and individual config vars (local)
// SSL required for Railway production connections
const sslConfig = isProduction ? { rejectUnauthorized: false } : false;

const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
  })
  : new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: sslConfig
  });

// Log connection details on startup
console.log('📊 Database config:', {
  connectionString: process.env.DATABASE_URL ? 'Using DATABASE_URL' : 'Using individual vars',
  host: process.env.DB_HOST || '(from DATABASE_URL)',
  database: process.env.DB_NAME || '(from DATABASE_URL)',
  ssl: process.env.DATABASE_URL ? 'enabled' : 'disabled'
});

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection error:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
