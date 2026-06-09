const { Pool } = require('pg');

// We are putting your local database settings directly here to ensure Node can read them!
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gym_tracker',
  password: 'jemjem181012', // 👈 Type your actual pgAdmin password here inside quotes
  port: 5432,
});

module.exports = pool;