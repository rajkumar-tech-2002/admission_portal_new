const db = require('./config/db.config');

async function checkDB() {
    try {
        const [communities] = await db.execute('SELECT * FROM community_master');
        console.log('COMMUNITIES:', communities);

        const [incomes] = await db.execute('SELECT * FROM annual_income_master');
        console.log('ANNUAL INCOMES:', incomes);

        const [religions] = await db.execute('SELECT * FROM religion_master');
        console.log('RELIGIONS:', religions);

        const [records] = await db.execute('SELECT selected_dept, selected_course, reference_institution FROM record_master LIMIT 10');
        console.log('EXISTING RECORDS:', records);

        process.exit(0);
    } catch (err) {
        console.error('ERROR CHECKING DB:', err);
        process.exit(1);
    }
}

checkDB();
