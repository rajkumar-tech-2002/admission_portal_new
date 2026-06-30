const path = require('path');
const fs = require('fs');

async function debugPaths() {
    console.log('--- Path Debug ---');
    console.log('__dirname:', __dirname);
    console.log('CWD:', process.cwd());
    const expectedEnvPath = path.resolve(__dirname, '../.env');
    console.log('Expected .env Path:', expectedEnvPath);
    console.log('.env Exists:', fs.existsSync(expectedEnvPath));
    
    // Test dotenv exactly like db.config.js
    const result = require('dotenv').config({ path: expectedEnvPath });
    if (result.error) {
        console.error('Dotenv Error:', result.error.message);
    } else {
        console.log('Dotenv Loaded Successfully');
        console.log('DB_HOST parsed as:', process.env.DB_HOST);
    }
}

debugPaths();
