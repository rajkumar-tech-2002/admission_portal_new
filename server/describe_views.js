require('dotenv').config();
const db = require('./config/db.config');

async function run() {
    try {
        const [feeCols] = await db.query('DESCRIBE student_fee_certificate_report');
        console.log('Fee & Certificate cols:', feeCols.map(r => r.Field).join(', '));
        
        const [countCols] = await db.query('DESCRIBE student_certificate_count_report');
        console.log('Certificate Count cols:', countCols.map(r => r.Field).join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
