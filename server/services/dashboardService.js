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
            SELECT COALESCE(SUM(amount), 0) as total_amount FROM income_lists
        `);
        const incomeStats = incomeStatsRes.rows[0];

        // 3. Expense Stats
        const expenseStatsRes = await client.query(`
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(net_amount), 0) as total_amount,
                COUNT(CASE WHEN internal_status LIKE '%รอ%' OR expense_type = 'สำรองจ่าย' THEN 1 END) as pending
            FROM expense_lists
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

// Get yearly cashflow data (Income vs Expenses)
const getYearlyCashflow = async (year) => {
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    const client = await db.pool.connect();
    try {
        // 1. Get Opening Balance (Total balance of all financial accounts)
        // Note: Ideally this should be calculated as of Jan 1st, but for MVP we use current balance derived sum
        // or we just return the current total balance as a reference.
        // For accurate graph, we might need a "Starting Balance of the Year". 
        // If we assumed the current balance is the result of all past transactions, 
        // we could try to calculate backwards, but that's complex.
        // As per plan, we query SUM(balance).
        const balanceRes = await client.query('SELECT SUM(balance) as total_balance FROM financial_accounts');
        const initialBalance = parseFloat(balanceRes.rows[0]?.total_balance || 0);

        // 2. Get Transactions
        const transactionsRes = await client.query(`
            SELECT 
                id::text, 
                'income' as type, 
                due_date, 
                amount, 
                description, 
                project_code 
            FROM income_lists 
            WHERE status != 'cancelled' 
              AND due_date BETWEEN $1 AND $2

            UNION ALL

            SELECT 
                id::text, 
                'expense' as type, 
                due_date, 
                net_amount as amount, 
                description, 
                project_code 
            FROM expense_lists 
            WHERE internal_status NOT IN ('Draft', 'reject ยกเลิก / รอแก้ไข', 'Rejected') 
              AND due_date BETWEEN $1 AND $2

            ORDER BY due_date ASC
        `, [startDate, endDate]);

        return {
            year: parseInt(targetYear),
            initial_balance: initialBalance,
            transactions: transactionsRes.rows
        };

    } finally {
        client.release();
    }
};

module.exports = {
    getDashboardStats,
    getYearlyCashflow
};
