const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true  // Return DATE/DATETIME columns as plain strings (not JS Date objects)
                       // This prevents timezone shifts: e.g. 2026-01-03 → "2026-01-02T18:30:00Z" in IST
});

module.exports = pool;
