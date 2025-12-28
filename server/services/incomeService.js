const db = require('../db');

// GET all incomes
const getAllIncomes = async () => {
    const result = await db.query('SELECT * FROM incomes ORDER BY date DESC, id DESC');
    return result.rows;
};

// GET incomes by project
const getIncomesByProject = async (projectCode) => {
    const result = await db.query('SELECT * FROM incomes WHERE project_code = $1 ORDER BY date DESC', [projectCode]);
    return result.rows;
};

// CREATE new income
const createIncome = async (incomeData) => {
    const {
        project_code, description, invoice_no, date, amount, status, created_by, account_id
    } = incomeData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        let targetAccountId = account_id;

        // If no account_id provided, find primary account
        if (!targetAccountId) {
            const accResult = await client.query('SELECT id FROM financial_accounts WHERE is_primary = TRUE LIMIT 1');
            if (accResult.rows.length > 0) {
                targetAccountId = accResult.rows[0].id;
            }
        }

        const result = await client.query(
            `INSERT INTO incomes (
                project_code, description, invoice_no, date, amount, status, created_by, account_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                project_code, description, invoice_no, date, amount,
                status || 'pending', created_by || 1, targetAccountId
            ]
        );

        const newIncome = result.rows[0];

        // LOGIC: If status is 'received' ('รับเงินแล้ว') and we have an account, add balance
        if ((status === 'รับเงินแล้ว' || status === 'Received') && targetAccountId) {
            await client.query(
                `UPDATE financial_accounts 
                 SET balance = balance + $1 
                 WHERE id = $2`,
                [amount, targetAccountId]
            );
        }

        await client.query('COMMIT');
        return newIncome;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// UPDATE income
const updateIncome = async (id, updateData) => {
    const { description, invoice_no, date, amount, status } = updateData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch current status to prevent double-addition logic
        const currentIncomeResult = await client.query('SELECT * FROM incomes WHERE id = $1', [id]);

        if (currentIncomeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null; // Not found
        }

        const currentData = currentIncomeResult.rows[0];
        const previousStatus = currentData.status;
        const previousAmount = parseFloat(currentData.amount);

        // 2. Update the income record
        const result = await client.query(
            `UPDATE incomes SET 
                description = $1, invoice_no = $2, date = $3, amount = $4, status = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 RETURNING *`,
            [description, invoice_no, date, amount, status, id]
        );

        const updatedIncome = result.rows[0];
        const newStatus = status;
        const newAmount = parseFloat(amount);
        const wasReceived = previousStatus === 'รับเงินแล้ว' || previousStatus === 'Received';
        const isReceived = newStatus === 'รับเงินแล้ว' || newStatus === 'Received';

        // 3. Handle balance changes based on status

        // Case 1: Was received, now NOT received -> Refund
        if (wasReceived && !isReceived && currentData.account_id) {
            await client.query(
                'UPDATE financial_accounts SET balance = balance - $1 WHERE id = $2',
                [previousAmount, currentData.account_id]
            );
        }
        // Case 2: Was NOT received, now IS received -> Add balance
        else if (!wasReceived && isReceived) {
            let targetAccountId = updatedIncome.account_id;

            // If no account_id, find primary account
            if (!targetAccountId) {
                const accResult = await client.query('SELECT id FROM financial_accounts WHERE is_primary = TRUE LIMIT 1');
                if (accResult.rows.length > 0) {
                    targetAccountId = accResult.rows[0].id;
                    // Link income to this account for history
                    await client.query('UPDATE incomes SET account_id = $1 WHERE id = $2', [targetAccountId, id]);
                }
            }

            // Add balance if we have an account ID
            if (targetAccountId) {
                await client.query(
                    'UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2',
                    [newAmount, targetAccountId]
                );
            }
        }
        // Case 3: Was received and still received but amount changed -> Adjust
        else if (wasReceived && isReceived && previousAmount !== newAmount && currentData.account_id) {
            const diff = newAmount - previousAmount;
            await client.query(
                'UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2',
                [diff, currentData.account_id]
            );
        }

        await client.query('COMMIT');
        return updatedIncome;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// DELETE income
const deleteIncome = async (id) => {
    const result = await db.query('DELETE FROM incomes WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};

module.exports = {
    getAllIncomes,
    getIncomesByProject,
    createIncome,
    updateIncome,
    deleteIncome
};
