const db = require('./config/db.config');

async function findStudentWithCommunity() {
    try {
        const [records] = await db.execute('SELECT * FROM record_master WHERE community IS NOT NULL AND community != "" LIMIT 5');
        console.log('STUDENTS WITH COMMUNITY:');
        records.forEach(r => {
            console.log({
                reg_no_12th: r.reg_no_12th,
                std_name: r.std_name,
                community: r.community,
                mobile: r.std_mobile_no
            });
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findStudentWithCommunity();
