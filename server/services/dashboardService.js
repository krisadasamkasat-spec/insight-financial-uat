const db = require('../db');

// Get all dashboard statistics
const getDashboardStats = async () => {
    const client = await db.pool.connect();
    try {
        // 1. Project Stats
        const projectStatsRes = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active
            FROM projects
        `);
        const projectStats = projectStatsRes.rows[0];

        // 2. Income Stats
        const incomeStatsRes = await client.query(`
            SELECT COALESCE(SUM(amount), 0) as total_amount FROM incomes
        `);
        const incomeStats = incomeStatsRes.rows[0];

        // 3. Expense Stats
        const expenseStatsRes = await client.query(`
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(net_amount), 0) as total_amount,
                COUNT(CASE WHEN status = 'สำรองจ่าย' THEN 1 END) as pending
            FROM expenses
        `);
        const expenseStats = expenseStatsRes.rows[0];

        // 4. Recent Projects (Limit 5)
        const recentProjectsRes = await client.query(`
            SELECT * FROM projects ORDER BY created_at DESC LIMIT 5
        `);

        return {
            projects: {
                total: parseInt(projectStats.total),
                active: parseInt(projectStats.active)
            },
            incomes: {
                totalAmount: parseFloat(incomeStats.total_amount)
            },
            expenses: {
                total: parseInt(expenseStats.total),
                totalAmount: parseFloat(expenseStats.total_amount),
                pending: parseInt(expenseStats.pending)
            },
            recentProjects: recentProjectsRes.rows
        };

    } finally {
        client.release();
    }
};

module.exports = {
    getDashboardStats
};
