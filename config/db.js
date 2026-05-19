const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pondok_absensi',
  password: '354313',
  port: 5433,
});

pool.connect((err) => {
  if (err) {
    console.log('Database error:', err.message);
  } else {
    console.log('Database connected');
  }
});

module.exports = pool;