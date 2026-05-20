async function testMasterEndpoint() {
    try {
        const res = await fetch('http://localhost:5000/api/master');
        console.log('STATUS:', res.status);
        const body = await res.json();
        console.log('SUCCESS:', body.success);
        console.log('KEYS:', Object.keys(body.data));
        console.log('COMMUNITIES:', body.data.communities);
        console.log('ANNUAL INCOMES:', body.data.annualIncome);
        console.log('RELIGIONS:', body.data.religions);
        process.exit(0);
    } catch (err) {
        console.error('API CALL FAILED:', err.message);
        process.exit(1);
    }
}

testMasterEndpoint();
