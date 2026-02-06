const db = require('../db');

// GET all accounts
const getAllAccounts = async () => {
    // Schema V2: id, bank_name, financial_account_number, financial_account_name, balance, created_at, updated_at
    // No is_active, is_primary, color, type in V2 schema from schema_new.sql
    // We will just return all.
    const result = await db.query(`
        SELECT * FROM financial_accounts 
        ORDER BY id ASC
    `);
    // Mock is_primary for frontend compatibility if needed
    // Or just let frontend handle it. Frontend expects 'is_primary' for logic?
    // ProjectDetail.jsx uses: const primary = accountsRes.data.find(acc => acc.is_primary) || accountsRes.data[0];
    // So we should fix schema or just mock it here.
    // Let's assume the first one is primary for now to avoid breaking UI.
    const rows = result.rows.map((row, index) => ({
        ...row,
        is_primary: index === 0 // Mock: First one is primary
    }));
    return rows;
};

// GET account by id
const getAccountById = async (id) => {
    const result = await db.query('SELECT * FROM financial_accounts WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
};

// CREATE new account
const createAccount = async (accountData) => {
    const {
        name, // Frontend sends 'name' -> map to financial_account_name
        account_number, // Frontend sends 'account_number' -> map to financial_account_number
        bank_name
    } = accountData;

    // Note: Schema V2 removed 'type', 'color', 'is_primary', 'is_active'. Balance defaults to 0.

    const result = await db.query(
        `INSERT INTO financial_accounts (financial_account_name, financial_account_number, bank_name, balance) 
         VALUES ($1, $2, $3, 0) 
         RETURNING *`,
        [name, account_number, bank_name]
    );

    return result.rows[0];
};

// UPDATE account
const updateAccount = async (id, accountData) => {
    const { name, account_number, bank_name } = accountData;

    const result = await db.query(
        `UPDATE financial_accounts 
         SET financial_account_name = COALESCE($1, financial_account_name),
             financial_account_number = COALESCE($2, financial_account_number),
             bank_name = COALESCE($3, bank_name),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [name, account_number, bank_name, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
};

// DELETE account (Hard delete as no is_active in V2)
const deleteAccount = async (id) => {
    // Might fail if used in incomes/expenses. Schema V2 has FKs.
    // Usually need soft delete or cascade. 
    // Schema V2 logic: users said "Full Reset", maybe didn't strictly ask for Soft Delete in new schema.
    // Let's try Delete.
    try {
        const result = await db.query('DELETE FROM financial_accounts WHERE id = $1 RETURNING *', [id]);
        return result.rows.length > 0;
    } catch (err) {
        console.error("Delete Account Failed (FK constraint likely):", err.message);
        throw err;
    }
};

// GET account transactions
const getAccountTransactions = async (id, limit = 20) => {
    // 1. Get account info
    const accountRes = await db.query('SELECT financial_account_number FROM financial_accounts WHERE id = $1', [id]);
    const accNum = accountRes.rows[0]?.financial_account_number;

    // 2. Incomes (linked by financial_account_id)
    // Table: income_lists
    // Schema V2: id, project_code, amount, description, financial_account_id
    // No 'date' column in income_lists V2 (removed). Uses 'created_at'.
    // Logic: User wanted simple income.

    // 3. Expenses (linked by bank_account_number/name? OR strictly not linked in schema?)
    // Table: expense_lists
    // Schema V2: bank_account_number (text).
    // It's a loose link by string matching if anything.

    // Construct Query
    let query = `
        SELECT 
            'income' as type, 
            id, 
            created_at as date, 
            description, 
            amount, 
            'received' as status 
        FROM income_lists 
        WHERE financial_account_id = $1
    `;

    const queryParams = [id];

    if (accNum) {
        query += `
            UNION ALL
            SELECT 
                'expense' as type, 
                id, 
                created_at as date, 
                description, 
                net_amount as amount, 
                internal_status as status 
            FROM expense_lists 
            WHERE bank_account_number = $2
        `;
        queryParams.push(accNum);
    }

    query += ` ORDER BY date DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    const result = await db.query(query, queryParams);
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
