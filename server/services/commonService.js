const db = require('../db');

// Roles
const getAllRoles = async () => {
    const result = await db.query('SELECT * FROM roles ORDER BY id');
    return result.rows;
};

// Project Types
const getAllProjectTypes = async () => {
    const result = await db.query('SELECT * FROM project_types ORDER BY id');
    return result.rows;
};

// Financial Statuses
const getFinancialStatuses = async (category) => {
    let query = 'SELECT * FROM financial_statuses';
    const params = [];

    if (category) {
        query += ' WHERE category = $1';
        params.push(category);
    }

    query += ' ORDER BY id';

    const result = await db.query(query, params);
    return result.rows;
};

module.exports = {
    getAllRoles,
    getAllProjectTypes,
    getFinancialStatuses
};
