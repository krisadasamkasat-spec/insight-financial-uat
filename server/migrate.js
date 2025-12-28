const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🔄 Checking database tables...');

    try {
        // Check if tables exist
        const result = await db.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'projects'
    `);

        const tablesExist = parseInt(result.rows[0].count) > 0;

        if (tablesExist) {
            console.log('✅ Database tables already exist. Skipping migration.');
            return true;
        }

        console.log('📦 Creating database tables...');

        // Read and run schema.sql
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await db.query(schema);

        console.log('✅ Database migration completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Migration error:', error.message);
        // Don't crash server, just log error
        return false;
    }
}

module.exports = runMigration;
