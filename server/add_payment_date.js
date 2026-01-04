const db = require('./db');

async function addPaymentDateColumn() {
    try {
        console.log('Adding payment_date column to expenses table...');
        await db.query(`
            ALTER TABLE expenses 
            ADD COLUMN IF NOT EXISTS payment_date DATE;
        `);
        console.log('Successfully added payment_date column.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        // We can't easily close the pool from the exported module if it doesn't expose end(), 
        // but the script will likely exit or we can force exit.
        process.exit(0);
    }
}

addPaymentDateColumn();
