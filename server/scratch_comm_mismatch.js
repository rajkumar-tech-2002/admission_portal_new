const db = require('./config/db.config');

async function checkCommunityMismatch() {
    try {
        const [communities] = await db.execute('SELECT community FROM community_master');
        const commList = communities.map(c => c.community);
        console.log('COMMUNITIES LIST IN MASTER:', commList);

        const [records] = await db.execute('SELECT reg_no_12th, std_name, community FROM record_master WHERE community IS NOT NULL');
        console.log('RECORDS WITH NON-NULL COMMUNITY:');
        records.forEach(r => {
            const match = commList.includes(r.community);
            console.log({
                name: r.std_name,
                communityInRecord: r.community,
                matchesMaster: match,
                charCodes: [...r.community].map(c => c.charCodeAt(0))
            });
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCommunityMismatch();
