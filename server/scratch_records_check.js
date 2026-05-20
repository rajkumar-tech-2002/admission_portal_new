const db = require('./config/db.config');

async function checkRecordMaster() {
    try {
        const [records] = await db.execute('SELECT * FROM record_master LIMIT 5');
        console.log('RECORDS IN RECORD_MASTER:');
        records.forEach(r => {
            console.log({
                reg_no_12th: r.reg_no_12th,
                std_name: r.std_name,
                community: r.community,
                admission_quota: r.admission_quota
            });
        });
        process.exit(0);
    } catch (err) {
        console.error('ERROR CHECKING RECORD_MASTER:', err);
        process.exit(1);
    }
}

checkRecordMaster();
