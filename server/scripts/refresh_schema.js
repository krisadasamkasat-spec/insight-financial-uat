const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const schemaPath = path.join(__dirname, '../database/schema.sql');

// Determine connection details
const user = process.env.DB_USER || 'postgres';
const host = process.env.DB_HOST || 'localhost';
const database = process.env.DB_NAME;
const password = process.env.DB_PASSWORD;
const port = process.env.DB_PORT || 5432;

if (!database) {
    console.error('❌ Error: DB_NAME is not defined in .env');
    process.exit(1);
}

console.log(`🔄 Dumping schema for database: ${database} at ${host}...`);

// Set PGPASSWORD environment variable for the child process
const env = { ...process.env, PGPASSWORD: password };

// Command to dump schema only (--schema-only) and no owner info (--no-owner) to keep it clean
const cmd = `pg_dump -h ${host} -p ${port} -U ${user} --schema-only --no-owner --no-privileges -f "${schemaPath}" ${database}`;

exec(cmd, { env }, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Error dumping schema: ${error.message}`);
        return;
    }
    if (stderr) {
        // pg_dump often outputs info to stderr, just log it
        console.log(`ℹ️ pg_dump info: ${stderr}`);
    }
    console.log(`✅ Schema dumped successfully to: ${schemaPath}`);
});
