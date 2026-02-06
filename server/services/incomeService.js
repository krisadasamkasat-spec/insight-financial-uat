const db = require('../db');

// GET all incomes
const getAllIncomes = async () => {
    const result = await db.query(`
        SELECT i.*, to_char(i.due_date, 'YYYY-MM-DD') as due_date, fa.financial_account_name as account_name,
               COALESCE(
                   (SELECT json_agg(json_build_object(
                       'id', ia.id,
                       'file_name', ia.file_name,
                       'file_path', ia.file_path,
                       'source', ia.source
                   ))
                   FROM income_attachments ia
                   WHERE ia.income_id = i.id
                   ), '[]'
               ) as attachments
        FROM income_lists i
        LEFT JOIN financial_accounts fa ON i.financial_account_id = fa.id
        ORDER BY i.due_date ASC, i.created_at DESC
    `);
    return result.rows;
};

// GET incomes by project
const getIncomesByProject = async (projectCode) => {
    const result = await db.query(`
        SELECT i.*, to_char(i.due_date, 'YYYY-MM-DD') as due_date, fa.financial_account_name as account_name,
               COALESCE(
                   (SELECT json_agg(json_build_object(
                       'id', ia.id,
                       'file_name', ia.file_name,
                       'file_path', ia.file_path,
                       'source', ia.source
                   ))
                   FROM income_attachments ia
                   WHERE ia.income_id = i.id
                   ), '[]'
               ) as attachments
        FROM income_lists i
        LEFT JOIN financial_accounts fa ON i.financial_account_id = fa.id
        WHERE i.project_code = $1 
        ORDER BY i.due_date ASC, i.created_at DESC
    `, [projectCode]);
    return result.rows;
};

// CREATE new income & Update Balance (if received)
const createIncome = async (incomeData) => {
    const {
        project_code, description, amount, financial_account_id, due_date, status = 'pending'
    } = incomeData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Resolve Account ID (Default to 1 if missing/invalid)
        let targetAccountId = financial_account_id;
        if (!targetAccountId) {
            const accResult = await client.query('SELECT id FROM financial_accounts ORDER BY id ASC LIMIT 1');
            if (accResult.rows.length > 0) targetAccountId = accResult.rows[0].id;
        }

        // 2. Insert Income
        const result = await client.query(
            `INSERT INTO income_lists (
                project_code, description, amount, financial_account_id, due_date, status
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *, to_char(due_date, 'YYYY-MM-DD') as due_date`,
            [project_code, description, amount || 0, targetAccountId, due_date, status]
        );
        const newIncome = result.rows[0];

        // 3. Update Account Balance ONLY IF RECEIVED
        if (targetAccountId && amount && status === 'received') {
            await client.query(
                `UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2`,
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

// UPDATE income & Adjust Balance based on status changes
const updateIncome = async (id, updateData) => {
    const { description, amount, financial_account_id, due_date, status } = updateData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Old Data
        const currentResult = await client.query('SELECT * FROM income_lists WHERE id = $1', [id]);
        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        const oldIncome = currentResult.rows[0];
        const oldAmount = parseFloat(oldIncome.amount) || 0;
        const oldAccId = oldIncome.financial_account_id;
        const oldStatus = oldIncome.status || 'pending';

        // 2. Prepare Updates
        const fields = [];
        const params = [];
        let pIdx = 1;

        if (description !== undefined) { fields.push(`description = $${pIdx++}`); params.push(description); }
        if (amount !== undefined) { fields.push(`amount = $${pIdx++}`); params.push(amount); }
        if (financial_account_id !== undefined) { fields.push(`financial_account_id = $${pIdx++}`); params.push(financial_account_id || null); }
        if (due_date !== undefined) { fields.push(`due_date = $${pIdx++}`); params.push(due_date || null); }
        if (status !== undefined) { fields.push(`status = $${pIdx++}`); params.push(status); }

        if (fields.length === 0) {
            await client.query('ROLLBACK');
            return oldIncome;
        }

        params.push(id);
        const updateQuery = `UPDATE income_lists SET ${fields.join(', ')} WHERE id = $${pIdx} RETURNING *, to_char(due_date, 'YYYY-MM-DD') as due_date`;
        const result = await client.query(updateQuery, params);
        const updatedIncome = result.rows[0];

        // 3. Adjust Balances Logic
        const newAmount = parseFloat(updatedIncome.amount) || 0;
        const newAccId = updatedIncome.financial_account_id;
        const newStatus = updatedIncome.status || 'pending';

        // Case 1: Was Received, Now Pending (Revert Balance)
        if (oldStatus === 'received' && newStatus !== 'received') {
            if (oldAccId) {
                await client.query('UPDATE financial_accounts SET balance = balance - $1 WHERE id = $2', [oldAmount, oldAccId]);
            }
        }
        // Case 2: Was Not Received, Now Received (Add Balance)
        else if (oldStatus !== 'received' && newStatus === 'received') {
            if (newAccId) {
                await client.query('UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2', [newAmount, newAccId]);
            }
        }
        // Case 3: Still Received, but Amount or Account changed (Adjust Difference)
        else if (oldStatus === 'received' && newStatus === 'received') {
            // Revert old
            if (oldAccId) {
                await client.query('UPDATE financial_accounts SET balance = balance - $1 WHERE id = $2', [oldAmount, oldAccId]);
            }
            // Add new
            if (newAccId) {
                await client.query('UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2', [newAmount, newAccId]);
            }
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

// DELETE income & Revert Balance (if received)
const deleteIncome = async (id) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const currentResult = await client.query('SELECT * FROM income_lists WHERE id = $1', [id]);
        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return false;
        }
        const oldIncome = currentResult.rows[0];

        // Delete Attachments first (or cascade)
        await client.query('DELETE FROM income_attachments WHERE income_id = $1', [id]);

        // Delete Record
        await client.query('DELETE FROM income_lists WHERE id = $1', [id]);

        // Revert Balance ONLY IF IT WAS RECEIVED
        if (oldIncome.status === 'received' && oldIncome.financial_account_id && oldIncome.amount) {
            await client.query(
                `UPDATE financial_accounts SET balance = balance - $1 WHERE id = $2`,
                [oldIncome.amount, oldIncome.financial_account_id]
            );
        }

        await client.query('COMMIT');
        return true;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const addAttachment = async (attachmentData) => {
    const { income_id, file_name, file_path, source } = attachmentData;
    const result = await db.query(
        `INSERT INTO income_attachments (income_id, file_name, file_path, source)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [income_id, file_name, file_path, source || 'upload']
    );
    return result.rows[0];
};

module.exports = {
    getAllIncomes,
    getIncomesByProject,
    createIncome,
    updateIncome,
    deleteIncome,
    addAttachment,
    deleteAttachment: async (id) => {
        const result = await db.query('DELETE FROM income_attachments WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};
