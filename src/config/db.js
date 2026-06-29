/**
 * src/config/db.js
 * MySQL connection pool using mysql2/promise.
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  decimalNumbers: true,
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getConnection() {
  return pool.getConnection();
}

module.exports = { query, getConnection };
