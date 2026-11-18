require('dotenv').config();

const mysql = require('mysql2/promise');

const port = Number(
  process.env.DB_PORT ||
  process.env.MYSQLPORT ||
  3306
);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT debe ser un puerto válido.');
}

const host = process.env.DB_HOST || process.env.MYSQLHOST;
const user = process.env.DB_USER || process.env.MYSQLUSER;
const database = process.env.DB_NAME || process.env.MYSQLDATABASE;

for (const [variable, value] of [
  ['DB_HOST/MYSQLHOST', host],
  ['DB_USER/MYSQLUSER', user],
  ['DB_NAME/MYSQLDATABASE', database]
]) {
  if (!value) {
    throw new Error(`Falta configurar la variable ${variable} en el entorno.`);
  }
}

const pool = mysql.createPool({
  host,
  port,
  user,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  dateStrings: true
});

module.exports = pool;
