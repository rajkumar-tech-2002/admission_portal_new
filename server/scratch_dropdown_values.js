const db = require('./config/db.config');

async function checkDropdownFields() {
    try {
        const [courses] = await db.execute('SELECT DISTINCT selected_course FROM record_master');
        console.log('SELECTED COURSES IN DB:', courses.map(c => c.selected_course));

        const [depts] = await db.execute('SELECT DISTINCT selected_dept FROM record_master');
        console.log('SELECTED DEPTS IN DB:', depts.map(d => d.selected_dept));

        const [quotas] = await db.execute('SELECT DISTINCT admission_quota FROM record_master');
        console.log('ADMISSION QUOTAS IN DB:', quotas.map(q => q.admission_quota));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDropdownFields();
