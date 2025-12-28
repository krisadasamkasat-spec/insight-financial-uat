const db = require('../db');

// GET all accounts
const getAllAccounts = async () => {
    const result = await db.query(`
        SELECT * FROM financial_accounts 
        WHERE is_active = TRUE 
        ORDER BY is_primary DESC, id ASC
    `);
    return result.rows;
};

// GET account by id
const getAccountById = async (id) => {
    const result = await db.query('SELECT * FROM financial_accounts WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
};

// CREATE new account
const createAccount = async (accountData) => {
    const { name, type, account_number, bank_code, balance, color, is_primary } = accountData;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // If this is set as primary, unset others
        if (is_primary) {
            await client.query('UPDATE financial_accounts SET is_primary = FALSE WHERE is_primary = TRUE');
        }

        const result = await client.query(
            `INSERT INTO financial_accounts (name, type, account_number, bank_code, balance, color, is_primary) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [name, type, account_number, bank_code, balance || 0, color, is_primary || false]
        );

        await client.query('COMMIT');
        return result.rows[0];

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// UPDATE account
const updateAccount = async (id, accountData) => {
    const { name, type, account_number, bank_code, color, is_primary } = accountData;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        if (is_primary) {
            await client.query('UPDATE financial_accounts SET is_primary = FALSE WHERE is_primary = TRUE AND id != $1', [id]);
        }

        const result = await client.query(
            `UPDATE financial_accounts 
             SET name = $1, type = $2, account_number = $3, bank_code = $4, color = $5, is_primary = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [name, type, account_number, bank_code, color, is_primary, id]
        );

        await client.query('COMMIT');
        return result.rows.length > 0 ? result.rows[0] : null;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// DELETE account (Soft delete)
const deleteAccount = async (id) => {
    const result = await db.query(
        'UPDATE financial_accounts SET is_active = FALSE WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows.length > 0;
};

// GET account transactions
const getAccountTransactions = async (id, limit = 20) => {
    const query = `
        SELECT 
            'income' as type, id, date, description, amount, status 
        FROM incomes 
        WHERE account_id = $1
        UNION ALL
        SELECT 
            'expense' as type, id, payment_date as date, description, net_amount as amount, status 
        FROM expenses 
        WHERE account_id = $1 AND (status = 'paid' OR status = 'จ่ายแล้ว' OR status = 'Paid')
        ORDER BY date DESC NULLS LAST
        LIMIT $2
    `;

    const result = await db.query(query, [id, limit]);
    return result.rows;
};

module.exports = {
    getAllAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountTransactions
};
