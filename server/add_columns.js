const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        await pool.execute(`
            ALTER TABLE student_admission_master
            ADD COLUMN consortium_number VARCHAR(255) NULL,
            ADD COLUMN consortium_batch VARCHAR(255) NULL,
            ADD COLUMN consortium_rank VARCHAR(255) NULL,
            ADD COLUMN counselling_number VARCHAR(255) NULL,
            ADD COLUMN counselling_round VARCHAR(255) NULL;
        `);
        console.log("Migration successful!");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist.");
        } else {
            console.error("Error migrating:", e);
        }
    } finally {
        await pool.end();
    }
}

migrate();
