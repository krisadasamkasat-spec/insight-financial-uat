const db = require('./db');

async function fixMissingColumns() {
    try {
        console.log('Checking and adding missing columns to expenses table...');

        // Add status column if not exists
        await db.query(`
            ALTER TABLE expenses 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'วางบิล';
        `);
        console.log('Checked/Added status column.');

        // Add reject_reason column if not exists
        await db.query(`
            ALTER TABLE expenses 
            ADD COLUMN IF NOT EXISTS reject_reason TEXT;
        `);
        console.log('Checked/Added reject_reason column.');

    } catch (err) {
        console.error('Error adding columns:', err);
    } finally {
        process.exit(0);
    }
}

fixMissingColumns();
