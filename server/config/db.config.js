const mysql = require('mysql2/promise');
require('dotenv').config({
    path: 'D:\\smartnandha\\testing_portal\\server\\.env'
});

console.log('DB CONFIG CHECK');
console.log('HOST:', process.env.DB_HOST);
console.log('USER:', process.env.DB_USER);
console.log('PASS:', process.env.DB_PASS ? 'LOADED' : 'MISSING');
console.log('DB:', process.env.DB_NAME);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;