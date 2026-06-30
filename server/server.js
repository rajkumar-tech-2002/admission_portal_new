const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '.env')
});

const app = require('./app');

const PORT = process.env.HTTP_PLATFORM_PORT || process.env.PORT || 5002;

console.log('--- Startup Debug ---');
console.log('CWD:', process.cwd());
console.log('DB_HOST:', process.env.DB_HOST ? 'LOADED' : 'MISSING');
console.log('---------------------');

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});