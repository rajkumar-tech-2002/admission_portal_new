const db = require('./config/db.config');

async function checkSpecificRecord() {
    try {
        const [records] = await db.execute('SELECT * FROM record_master WHERE std_mobile_no = "9043067869"');
        console.log('SPECIFIC RECORD:', records[0]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSpecificRecord();
