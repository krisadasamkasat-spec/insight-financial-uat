const db = require('../db');

// GET all expenses
const getAllExpenses = async () => {
    const result = await db.query(`
        SELECT e.*, ac.title as account_title,
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
        FROM expenses e
        LEFT JOIN account_codes ac ON e.account_code = ac.code
        ORDER BY e.created_at DESC
    `);
    return result.rows;
};

// GET expenses by project
const getExpensesByProject = async (projectCode) => {
    const result = await db.query(`
        SELECT e.*, ac.title as account_title,
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
        FROM expenses e
        LEFT JOIN account_codes ac ON e.account_code = ac.code
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
        expense_type,          // วางบิล / เบิกที่สำรองจ่าย
        contact,               // ชื่อเล่น
        bill_header,           // หัวบิล/ชื่อจริง
        description,
        bank_name,
        bank_account_number,
        bank_account_name,
        phone,
        email,
        price,
        discount,
        vat_amount,
        payback_to,
        wht_amount,
        net_amount,
        due_date,
        internal_status,
        peak_status,
        report_month
    } = expenseData;




    const result = await db.query(
        `INSERT INTO expenses (
            project_code, account_code, expense_type,
            contact, bill_header, payback_to, description,
            bank_name, bank_account_number, bank_account_name, phone, email,
            price, discount, vat_amount, wht_amount, net_amount,
            due_date, internal_status, peak_status, report_month
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
            price || 0,
            discount || 0,
            vat_amount || 0,
            wht_amount || 0,
            net_amount || 0,
            due_date || null,
            internal_status || null,
            peak_status || null,
            report_month || null
        ]
    );


    return result.rows[0];
};

// UPDATE expense
const updateExpense = async (id, updateData) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch current expense
        const currentResult = await client.query(
            'SELECT * FROM expenses WHERE id = $1',
            [id]
        );

        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramIdx = 1;

        const fields = [
            'project_code', 'account_code', 'expense_type',
            'contact', 'bill_header', 'description', 'payback_to',
            'bank_name', 'bank_account_number', 'bank_account_name',
            'phone', 'email',
            'price', 'discount', 'vat_amount', 'wht_amount', 'net_amount',
            'due_date', 'internal_status', 'peak_status', 'report_month',
            'reject_reason'
        ];

        for (const field of fields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(updateData[field]);
            }
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const updateQuery = `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
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
    const { internal_status, peak_status, approved_at, reject_reason, rejected_by, rejected_at } = updateData;

    const updates = [];
    const params = [];
    let paramIdx = 1;

    if (internal_status !== undefined) {
        updates.push(`internal_status = $${paramIdx++}`);
        params.push(internal_status);
    }

    if (peak_status !== undefined) {
        updates.push(`peak_status = $${paramIdx++}`);
        params.push(peak_status);
    }

    if (approved_at !== undefined) {
        updates.push(`approved_at = $${paramIdx++}`);
        params.push(approved_at);
    }

    if (reject_reason !== undefined) {
        updates.push(`reject_reason = $${paramIdx++}`);
        params.push(reject_reason);
    }

    if (rejected_by !== undefined) {
        updates.push(`rejected_by = $${paramIdx++}`);
        params.push(rejected_by);
    }

    if (rejected_at !== undefined) {
        updates.push(`rejected_at = $${paramIdx++}`);
        params.push(rejected_at);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 1) {
        // Only updated_at, nothing to change
        const result = await db.query('SELECT * FROM expenses WHERE id = $1', [id]);
        return result.rows[0];
    }

    params.push(id);
    const query = `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
    const result = await db.query(query, params);

    return result.rows[0];
};

// DELETE expense
const deleteExpense = async (id) => {
    // First delete related attachments
    await db.query('DELETE FROM expense_attachments WHERE expense_id = $1', [id]);

    const result = await db.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};

// GET all account codes (renamed from expense_codes)
const getAllAccountCodes = async () => {
    const result = await db.query('SELECT * FROM account_codes ORDER BY code ASC');
    return result.rows;
};

// For backward compatibility
const getAllExpenseCodes = getAllAccountCodes;

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

module.exports = {
    getAllExpenses,
    getExpensesByProject,
    createExpense,
    updateExpense,
    updateExpenseStatus,
    deleteExpense,
    getAllExpenseCodes,
    getAllAccountCodes,
    addAttachment,
    deleteAttachment: async (id) => {
        const result = await db.query('DELETE FROM expense_attachments WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};
