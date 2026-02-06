const db = require('../db');

// GET all account codes
const getAllAccountCodes = async () => {
    const result = await db.query(`
        SELECT * FROM account_codes 
        ORDER BY account_code ASC
    `);
    return result.rows;
};

// GET account code by code
const getAccountCodeByCode = async (code) => {
    const result = await db.query(
        'SELECT * FROM account_codes WHERE account_code = $1',
        [code]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
};

// CREATE new account code
const createAccountCode = async (data) => {
    const { account_code, account_description } = data;

    const result = await db.query(
        `INSERT INTO account_codes (account_code, account_description)
         VALUES ($1, $2)
         RETURNING *`,
        [account_code, account_description]
    );
    return result.rows[0];
};

// UPDATE account code
const updateAccountCode = async (code, data) => {
    const { account_description } = data;

    const result = await db.query(
        `UPDATE account_codes
         SET account_description = COALESCE($1, account_description)
         WHERE account_code = $2
         RETURNING *`,
        [account_description, code]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
};

// DELETE account code
const deleteAccountCode = async (code) => {
    try {
        const result = await db.query(
            'DELETE FROM account_codes WHERE account_code = $1 RETURNING *',
            [code]
        );
        return result.rows.length > 0;
    } catch (err) {
        console.error("Delete Account Code Failed (FK constraint likely):", err.message);
        throw err;
    }
};

module.exports = {
    getAllAccountCodes,
    getAccountCodeByCode,
    createAccountCode,
    updateAccountCode,
    deleteAccountCode
};
