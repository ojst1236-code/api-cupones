require('dotenv').config();

const mysql = require('mysql2/promise');

const port = Number(process.env.DB_PORT || 3306);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT debe ser un puerto válido.');
}

for (const variable of ['DB_HOST', 'DB_USER', 'DB_NAME']) {
  if (!process.env[variable]) {
    throw new Error(`Falta configurar la variable ${variable} en el archivo .env.`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  dateStrings: true
});

module.exports = pool;
