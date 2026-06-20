// config/db.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log('✅ MySQL connection established');
    // Export the connection for other modules
    module.exports = connection;
  } catch (err) {
    console.error('❌ Could not connect to MySQL:', err.message);
    process.exit(1);
  }
}

initDB();
