const db = require('../db');

// GET all members
const getAllMembers = async () => {
    const result = await db.query('SELECT * FROM team_members WHERE is_active = TRUE ORDER BY id');
    return result.rows;
};

// CREATE member
const createMember = async (memberData) => {
    const { name, nickname, type, email, phone, bank_account, bank_account_name, bank_name, tax_id, is_company } = memberData;

    const result = await db.query(
        `INSERT INTO team_members (name, nickname, type, email, phone, bank_account, bank_account_name, bank_name, tax_id, is_company) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [name, nickname, type, email, phone, bank_account, bank_account_name, bank_name, tax_id, is_company || false]
    );
    return result.rows[0];
};

// UPDATE member
const updateMember = async (id, memberData) => {
    const { name, nickname, type, email, phone, bank_account, bank_account_name, bank_name, tax_id, is_company } = memberData;

    const result = await db.query(
        `UPDATE team_members 
         SET name = COALESCE($2, name), 
             nickname = COALESCE($3, nickname), 
             type = COALESCE($4, type), 
             email = COALESCE($5, email), 
             phone = COALESCE($6, phone), 
             bank_account = COALESCE($7, bank_account),
             bank_account_name = COALESCE($8, bank_account_name), 
             bank_name = COALESCE($9, bank_name), 
             tax_id = COALESCE($10, tax_id),
             is_company = COALESCE($11, is_company),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [id, name, nickname, type, email, phone, bank_account, bank_account_name, bank_name, tax_id, is_company]
    );
    return result.rows[0];
};

// DELETE member (soft delete)
const deleteMember = async (id) => {
    const result = await db.query(
        'UPDATE team_members SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
    );
    return result.rows[0];
};

module.exports = {
    getAllMembers,
    createMember,
    updateMember,
    deleteMember
};

