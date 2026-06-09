const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gym_tracker',
  password: 'jemjem181012', 
  port: 5432,
});

module.exports = pool;
