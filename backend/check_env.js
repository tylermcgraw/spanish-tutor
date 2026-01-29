require('dotenv').config({ path: '../.env' });

console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...');
}
const db = require('./db');
console.log('DB Config Loaded');
