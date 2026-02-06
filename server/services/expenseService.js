const db = require('../db');

// GET all expenses
const getAllExpenses = async () => {
    const result = await db.query(`
        SELECT e.*, 
               to_char(e.issue_date, 'YYYY-MM-DD') as issue_date,
               to_char(e.due_date, 'YYYY-MM-DD') as due_date,
               ac.account_description as account_title,
               COALESCE(
                   (SELECT json_agg(json_build_object(
                       'id', ea.id,
                       'file_name', ea.file_name,
                       'file_path', ea.file_path,
                       'source', ea.source
                   ))
                   FROM expense_attachments ea
                   WHERE ea.expense_id = e.id
                   ), '[]'
               ) as attachments
        FROM expense_lists e
        LEFT JOIN account_codes ac ON e.account_code = ac.account_code
        ORDER BY e.created_at DESC
    `);
    return result.rows;
};

// GET expenses by project
const getExpensesByProject = async (projectCode) => {
    const result = await db.query(`
        SELECT e.*, 
               to_char(e.issue_date, 'YYYY-MM-DD') as issue_date,
               to_char(e.due_date, 'YYYY-MM-DD') as due_date,
               ac.account_description as account_title,
               COALESCE(
                   (SELECT json_agg(json_build_object(
                       'id', ea.id,
                       'file_name', ea.file_name,
                       'file_path', ea.file_path,
                       'source', ea.source
                   ))
                   FROM expense_attachments ea
                   WHERE ea.expense_id = e.id
                   ), '[]'
               ) as attachments
        FROM expense_lists e
        LEFT JOIN account_codes ac ON e.account_code = ac.account_code
        WHERE e.project_code = $1 
        ORDER BY e.created_at DESC
    `, [projectCode]);
    return result.rows;
};

// CREATE new expense
const createExpense = async (expenseData) => {
    const {
        project_code,
        account_code,
        expense_type,
        contact,
        bill_header,
        description,
        payback_to,
        bank_name,
        bank_account_number,
        bank_account_name,
        phone,
        email,
        amount,         // New Name
        discount,
        vat,            // New: Percent
        vat_amount,
        wht,            // New: Percent
        wht_amount,
        net_amount,
        issue_date,     // New Name
        due_date,
        internal_status,
        created_by
    } = expenseData;

    const result = await db.query(
        `INSERT INTO expense_lists (
            project_code, account_code, expense_type,
            contact, bill_header, payback_to, description,
            bank_name, bank_account_number, bank_account_name, phone, email,
            amount, discount, vat, vat_amount, wht, wht_amount, net_amount,
            issue_date, due_date, internal_status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $23)
        RETURNING *`,
        [
            project_code,
            account_code,
            expense_type || 'วางบิล',
            contact || null,
            bill_header || null,
            payback_to || null,
            description || null,
            bank_name || null,
            bank_account_number || null,
            bank_account_name || null,
            phone || null,
            email || null,
            amount || 0,
            discount || 0,
            vat || 0,
            vat_amount || 0,
            wht || 0,
            wht_amount || 0,
            net_amount || 0,
            issue_date || null,
            due_date || null,
            internal_status || 'Draft',
            created_by || 1
        ]
    );

    return result.rows[0];
};

// UPDATE expense
const updateExpense = async (id, updateData) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check exist
        const currentResult = await client.query('SELECT 1 FROM expense_lists WHERE id = $1', [id]);
        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const fields = [];
        const params = [];
        let paramIdx = 1;

        const allowedFields = [
            'project_code', 'account_code', 'expense_type',
            'contact', 'bill_header', 'description', 'payback_to',
            'bank_name', 'bank_account_number', 'bank_account_name',
            'phone', 'email',
            'amount', 'discount', 'vat', 'vat_amount', 'wht', 'wht_amount', 'net_amount',
            'issue_date', 'due_date', 'internal_status',
            'reject_reason', 'updated_by'
        ];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                fields.push(`${field} = $${paramIdx++}`);
                params.push(updateData[field]);
            }
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const updateQuery = `UPDATE expense_lists SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
        const result = await client.query(updateQuery, params);

        await client.query('COMMIT');
        return result.rows[0];

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// UPDATE expense internal status (workflow)
const updateExpenseStatus = async (id, updateData) => {
    const {
        internal_status,
        approved_by, approved_at,
        reject_reason, rejected_by, rejected_at
    } = updateData;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Old Data
        const currentResult = await client.query('SELECT * FROM expense_lists WHERE id = $1', [id]);
        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        const oldExpense = currentResult.rows[0];
        const oldStatus = oldExpense.internal_status;

        // Resolve Account ID (Default to 1 if missing)
        // In future, expense should handle account_id selection. For now default to 1 (Main)
        let targetAccountId = oldExpense.account_id;
        if (!targetAccountId) {
            // Find first account
            const accResult = await client.query('SELECT id FROM financial_accounts ORDER BY id ASC LIMIT 1');
            if (accResult.rows.length > 0) targetAccountId = accResult.rows[0].id;
        }

        // 2. Prepare Updates
        const fields = [];
        const params = [];
        let paramIdx = 1;

        if (internal_status !== undefined) { fields.push(`internal_status = $${paramIdx++}`); params.push(internal_status); }
        if (approved_by !== undefined) { fields.push(`approved_by = $${paramIdx++}`); params.push(approved_by); }
        if (approved_at !== undefined) { fields.push(`approved_at = $${paramIdx++}`); params.push(approved_at); }
        if (rejected_by !== undefined) { fields.push(`rejected_by = $${paramIdx++}`); params.push(rejected_by); }
        if (rejected_at !== undefined) { fields.push(`rejected_at = $${paramIdx++}`); params.push(rejected_at); }
        if (reject_reason !== undefined) { fields.push(`reject_reason = $${paramIdx++}`); params.push(reject_reason); }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const query = `UPDATE expense_lists SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
        const result = await client.query(query, params);
        const updatedExpense = result.rows[0];

        // 3. Balance Adjustment Logic
        // Status String for Approval: 'VP อนุมัติแล้ว ส่งเบิกได้'
        const APPROVED_STATUS = 'VP อนุมัติแล้ว ส่งเบิกได้';
        // Use net_amount (final amount) or amount? usually net_amount includes vat/wht logic? 
        // Assuming net_amount is the payout amount. If null, use amount (which is the new standard field).
        const amountToDeduct = parseFloat(updatedExpense.net_amount) || parseFloat(updatedExpense.amount) || 0;

        if (targetAccountId && amountToDeduct > 0) {
            // Case A: Being Approved (Not Approved -> Approved)
            if (internal_status === APPROVED_STATUS && oldStatus !== APPROVED_STATUS) {
                await client.query(
                    'UPDATE financial_accounts SET balance = balance - $1 WHERE id = $2',
                    [amountToDeduct, targetAccountId]
                );
            }
            // Case B: Being Reverted/Rejected (Approved -> Not Approved)
            // e.g. User changes back to 'รอแก้ไข' or 'Trash'
            else if (oldStatus === APPROVED_STATUS && internal_status !== undefined && internal_status !== APPROVED_STATUS) {
                await client.query(
                    'UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2',
                    [amountToDeduct, targetAccountId]
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

// DELETE expense
const deleteExpense = async (id) => {
    await db.query('DELETE FROM expense_attachments WHERE expense_id = $1', [id]);
    const result = await db.query('DELETE FROM expense_lists WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};

// GET all account codes
const getAllAccountCodes = async () => {
    const result = await db.query(`
        SELECT 
            account_code as code, 
            account_description as title 
        FROM account_codes 
        ORDER BY account_code ASC
    `);
    return result.rows;
};

const addAttachment = async (attachmentData) => {
    const { expense_id, file_name, file_path, source } = attachmentData;
    const result = await db.query(
        `INSERT INTO expense_attachments (expense_id, file_name, file_path, source)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [expense_id, file_name, file_path, source || 'upload']
    );
    return result.rows[0];
};

// Link contact documents to expense (copy from contact_documents to expense_attachments)
const linkContactDocuments = async (expenseId, linkedDocIds) => {
    if (!linkedDocIds || linkedDocIds.length === 0) return [];

    const attachments = [];
    for (const docId of linkedDocIds) {
        // Fetch the contact document
        const docResult = await db.query(
            'SELECT file_name, file_path FROM contact_documents WHERE id = $1',
            [docId]
        );
        if (docResult.rows.length > 0) {
            const doc = docResult.rows[0];
            // Insert into expense_attachments with source='contact'
            const attachment = await addAttachment({
                expense_id: expenseId,
                file_name: doc.file_name,
                file_path: doc.file_path,
                source: 'contact'
            });
            attachments.push(attachment);
        }
    }
    return attachments;
};

module.exports = {
    getAllExpenses,
    getExpensesByProject,
    createExpense,
    updateExpense,
    updateExpenseStatus,
    deleteExpense,
    getAllAccountCodes, // Standard new name
    getAllExpenseCodes: getAllAccountCodes, // Alias for backward compat
    addAttachment,
    linkContactDocuments,
    deleteAttachment: async (id) => {
        const result = await db.query('DELETE FROM expense_attachments WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};
