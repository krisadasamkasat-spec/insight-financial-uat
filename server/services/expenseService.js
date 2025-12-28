const db = require('../db');

// GET all expenses
const getAllExpenses = async () => {
    const result = await db.query(`
        SELECT e.*, ec.title as expense_category 
        FROM expenses e
        LEFT JOIN expense_codes ec ON e.expense_code = ec.code
        ORDER BY e.created_at DESC
    `);
    return result.rows;
};

// GET expenses by project
const getExpensesByProject = async (projectCode) => {
    const result = await db.query(`
        SELECT e.*, ec.title as expense_category 
        FROM expenses e
        LEFT JOIN expense_codes ec ON e.expense_code = ec.code
        WHERE e.project_code = $1 
        ORDER BY e.created_at DESC
    `, [projectCode]);
    return result.rows;
};

// CREATE new expense
const createExpense = async (expenseData) => {
    const {
        project_code, expense_code, description, title, status, recipient,
        issue_date, payment_date, base_amount, vat_rate, wht_rate, net_amount,
        created_by, account_id
    } = expenseData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO expenses (
                project_code, expense_code, description, title, status, recipient,
                issue_date, payment_date, base_amount, vat_rate, wht_rate, net_amount,
                created_by, account_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                project_code, expense_code, description, title, status, recipient,
                issue_date || null, payment_date || null, base_amount,
                vat_rate !== undefined && vat_rate !== null ? vat_rate : 7.00,
                wht_rate !== undefined && wht_rate !== null ? wht_rate : 3.00,
                net_amount,
                created_by || 1,
                account_id || null
            ]
        );

        const newExpense = result.rows[0];

        // LOGIC: If status is 'paid' ('จ่ายแล้ว') and account_id is present, deduct balance
        if ((status === 'จ่ายแล้ว' || status === 'Paid') && account_id) {
            await client.query(
                `UPDATE financial_accounts 
                 SET balance = balance - $1 
                 WHERE id = $2`,
                [net_amount, account_id]
            );
        }

        await client.query('COMMIT');
        return newExpense;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// UPDATE expense status (workflow) and payment_date
const updateExpenseStatus = async (id, updateData) => {
    const { status, approved_by, reject_reason, payment_date } = updateData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch current status to prevent double-deduction logic
        const currentExpenseResult = await client.query('SELECT status, account_id, net_amount FROM expenses WHERE id = $1', [id]);

        if (currentExpenseResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null; // Not found
        }

        const currentData = currentExpenseResult.rows[0];
        const previousStatus = currentData.status;

        // Build dynamic update query
        let setClauses = [];
        let params = [];
        let paramIndex = 1;

        // Only update status if provided
        if (status !== undefined) {
            setClauses.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        // Handle payment_date update
        if (payment_date !== undefined) {
            setClauses.push(`payment_date = $${paramIndex}`);
            params.push(payment_date);
            paramIndex++;
        }

        if (status === 'อนุมัติจ่าย' && approved_by) {
            setClauses.push(`approved_by = $${paramIndex}`);
            params.push(approved_by);
            paramIndex++;
            setClauses.push(`approved_at = CURRENT_TIMESTAMP`);
        }

        if (status === 'Reject' && reject_reason) {
            setClauses.push(`reject_reason = $${paramIndex}`);
            params.push(reject_reason);
            paramIndex++;
        }

        // Always update updated_at
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        // Build and execute query
        if (setClauses.length === 1) {
            // Only updated_at, nothing else to update
            await client.query('ROLLBACK');
            return currentExpenseResult.rows[0];
        }

        const query = `UPDATE expenses SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        params.push(id);

        const result = await client.query(query, params);
        const updatedExpense = result.rows[0];

        // LOGIC: If status changed to 'paid' ('จ่ายแล้ว')
        // FIX: Only deduct if it wasn't ALREADY paid
        if ((status === 'จ่ายแล้ว' || status === 'Paid') && (previousStatus !== 'จ่ายแล้ว' && previousStatus !== 'Paid')) {
            let accountId = updatedExpense.account_id;
            let netAmount = updatedExpense.net_amount;

            // If no account_id, find primary account
            if (!accountId) {
                const accResult = await client.query('SELECT id FROM financial_accounts WHERE is_primary = TRUE LIMIT 1');
                if (accResult.rows.length > 0) {
                    accountId = accResult.rows[0].id;
                    // Link expense to this account for history
                    await client.query('UPDATE expenses SET account_id = $1 WHERE id = $2', [accountId, id]);
                }
            }

            // Deduct balance if we have an account ID
            if (accountId) {
                await client.query(
                    `UPDATE financial_accounts 
                     SET balance = balance - $1 
                     WHERE id = $2`,
                    [netAmount, accountId]
                );
            }
        }

        await client.query('COMMIT');
        return updatedExpense;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// UPDATE expense (full update)
const updateExpense = async (id, updateData) => {
    const {
        expense_code, description, title, status, recipient,
        issue_date, payment_date, base_amount, vat_rate, wht_rate, net_amount,
        account_id
    } = updateData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch current expense data
        const currentResult = await client.query(
            'SELECT * FROM expenses WHERE id = $1',
            [id]
        );

        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const current = currentResult.rows[0];
        const previousStatus = current.status;
        const previousNetAmount = parseFloat(current.net_amount);

        // 2. Build update query dynamically
        const updates = [];
        const params = [];
        let paramIdx = 1;

        if (expense_code !== undefined) {
            updates.push(`expense_code = $${paramIdx++}`);
            params.push(expense_code);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIdx++}`);
            params.push(description);
        }
        if (title !== undefined) {
            updates.push(`title = $${paramIdx++}`);
            params.push(title);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramIdx++}`);
            params.push(status);
        }
        if (recipient !== undefined) {
            updates.push(`recipient = $${paramIdx++}`);
            params.push(recipient);
        }
        if (issue_date !== undefined) {
            updates.push(`issue_date = $${paramIdx++}`);
            params.push(issue_date);
        }
        if (payment_date !== undefined) {
            updates.push(`payment_date = $${paramIdx++}`);
            params.push(payment_date);
        }
        if (base_amount !== undefined) {
            updates.push(`base_amount = $${paramIdx++}`);
            params.push(base_amount);
        }
        if (vat_rate !== undefined) {
            updates.push(`vat_rate = $${paramIdx++}`);
            params.push(vat_rate);
        }
        if (wht_rate !== undefined) {
            updates.push(`wht_rate = $${paramIdx++}`);
            params.push(wht_rate);
        }
        if (net_amount !== undefined) {
            updates.push(`net_amount = $${paramIdx++}`);
            params.push(net_amount);
        }
        if (account_id !== undefined) {
            updates.push(`account_id = $${paramIdx++}`);
            params.push(account_id);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const updateQuery = `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
        const result = await client.query(updateQuery, params);
        const updated = result.rows[0];

        // 3. Handle balance changes based on status
        const newStatus = status !== undefined ? status : previousStatus;
        const newNetAmount = net_amount !== undefined ? parseFloat(net_amount) : previousNetAmount;
        const isPaidOld = previousStatus === 'จ่ายแล้ว' || previousStatus === 'Paid';
        const isPaidNew = newStatus === 'จ่ายแล้ว' || newStatus === 'Paid';
        const targetAccountId = account_id !== undefined ? account_id : current.account_id;

        // Case 1: Was paid, now NOT paid -> Refund
        if (isPaidOld && !isPaidNew && current.account_id) {
            await client.query(
                'UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2',
                [previousNetAmount, current.account_id]
            );
        }
        // Case 2: Was NOT paid, now IS paid -> Deduct
        else if (!isPaidOld && isPaidNew) {
            let accId = targetAccountId;
            if (!accId) {
                const accResult = await client.query('SELECT id FROM financial_accounts WHERE is_primary = TRUE LIMIT 1');
                if (accResult.rows.length > 0) {
                    accId = accResult.rows[0].id;
                    await client.query('UPDATE expenses SET account_id = $1 WHERE id = $2', [accId, id]);
                }
            }
            if (accId) {
                await client.query(
                    'UPDATE financial_accounts SET balance = balance - $1 WHERE id = $2',
                    [newNetAmount, accId]
                );
            }
        }
        // Case 3: Was paid and still paid but amount changed -> Adjust
        else if (isPaidOld && isPaidNew && previousNetAmount !== newNetAmount && current.account_id) {
            const diff = newNetAmount - previousNetAmount;
            await client.query(
                'UPDATE financial_accounts SET balance = balance - $1 WHERE id = $2',
                [diff, current.account_id]
            );
        }

        await client.query('COMMIT');
        return updated;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// DELETE expense
const deleteExpense = async (id) => {
    const result = await db.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};


const getAllExpenseCodes = async () => {
    const result = await db.query('SELECT * FROM expense_codes ORDER BY code ASC');
    return result.rows;
};

module.exports = {
    getAllExpenses,
    getExpensesByProject,
    createExpense,
    updateExpense,
    updateExpenseStatus,
    deleteExpense,
    getAllExpenseCodes
};

