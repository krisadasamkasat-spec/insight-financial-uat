const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // SSL required for Railway public connections
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Log connection details on startup
console.log('📊 Database config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  ssl: isProduction ? 'enabled' : 'disabled'
});

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection error:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
