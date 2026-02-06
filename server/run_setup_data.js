const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface to ask for DATABASE_URL
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const run = async () => {
    console.log('🚀 Insight Financial - Manual Database Setup Script');
    console.log('===================================================');
    console.log('This script will connect to your Railway database and run the setup SQL.');

    rl.question('👉 Please paste your Railway DATABASE_URL here:\n> ', async (dbUrl) => {
        if (!dbUrl || !dbUrl.trim()) {
            console.error('❌ Error: DATABASE_URL is required.');
            rl.close();
            return;
        }

        const pool = new Pool({
            connectionString: dbUrl.trim(),
            ssl: { rejectUnauthorized: false } // Required for Railway
        });

        try {
            console.log('\n🔄 Connecting to database...');
            const client = await pool.connect();
            console.log('✅ Connected successfully!');

            console.log('📖 Reading setup_reference_data.sql...');
            // Try to find the file in root or parent (since this script is in server/ or root)
            // We assume this script is placed in 'server/' folder, so look up one level or same level
            let sqlPath = path.join(__dirname, '../setup_reference_data.sql');
            if (!fs.existsSync(sqlPath)) {
                // Try looking in current folder
                sqlPath = path.join(__dirname, 'setup_reference_data.sql');
            }
            if (!fs.existsSync(sqlPath)) {
                // Try looking in desktop folder (hardcoded for this user context just in case)
                sqlPath = 'c:\\Users\\pamum\\Desktop\\Coding\\insight financial\\setup_reference_data.sql';
            }

            if (!fs.existsSync(sqlPath)) {
                throw new Error(`Could not find setup_reference_data.sql. Please ensure it exists in the project folder.`);
            }

            const sql = fs.readFileSync(sqlPath, 'utf8');
            console.log(`✅ SQL file found (${sql.length} bytes).`);

            console.log('⏳ Executing Query (this may take a few seconds)...');
            await client.query(sql);

            console.log('🎉 SUCCESS! All tables and seed data have been created.');
            client.release();
        } catch (err) {
            console.error('\n❌ ERROR:', err.message);
        } finally {
            await pool.end();
            rl.close();
            process.exit(0);
        }
    });
};

run();
