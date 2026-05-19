const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'pondok_absensi',
  password: '354313',
  port: 5433
});

client.connect()
  .then(() => {
    console.log('CONNECTED');
    return client.end();
  })
  .catch(err => {
    console.log('ERROR:', err.message);
  });