const mysql = require('mysql2/promise');
const path = require('path');

// Replicate server.js env loading exactly
require('dotenv').config({
    path: path.resolve(__dirname, '.env')
});

async function testPool() {
    console.log('--- DB Pool Test ---');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    
    // Use pool just like db.config.js
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
    });

    try {
        console.log('Attempting to get connection from pool...');
        const connection = await pool.getConnection();
        console.log('✅ Pool Connection Successful!');
        
        const [rows] = await connection.execute('SELECT DATABASE() as db');
        console.log('Connected to database:', rows[0].db);
        
        connection.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Pool Connection Failed!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
    }
}

testPool();
