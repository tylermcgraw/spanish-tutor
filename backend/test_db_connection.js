const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log('Testing DB connection...');
    console.log('URL:', process.env.DATABASE_URL ? 'Loaded from .env' : 'Using default (might fail)');
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0].now);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.message.includes('password authentication failed')) {
        console.error('Hint: Check your password in .env');
    }
    if (err.message.includes('role')) {
        console.error('Hint: Check your username in .env');
    }
  }
}

testConnection();
