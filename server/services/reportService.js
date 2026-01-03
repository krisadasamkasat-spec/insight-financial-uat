const db = require('../db');

// Get available years for reports
const getAvailableYears = async () => {
    const incomeYears = await db.query(
        "SELECT DISTINCT EXTRACT(YEAR FROM date) as year FROM incomes ORDER BY year DESC"
    );
    const expenseYears = await db.query(
        "SELECT DISTINCT EXTRACT(YEAR FROM issue_date) as year FROM expenses WHERE issue_date IS NOT NULL ORDER BY year DESC"
    );

    const years = new Set([
        ...incomeYears.rows.map(r => parseInt(r.year)),
        ...expenseYears.rows.map(r => parseInt(r.year))
    ]);

    // Ensure current year is always available
    years.add(new Date().getFullYear());

    return Array.from(years).sort((a, b) => b - a);
};

// Get report summary for a specific year
const getReportSummary = async (year) => {
    // Monthly Income
    const monthlyIncomeRes = await db.query(`
        SELECT 
            EXTRACT(MONTH FROM date) as month,
            COUNT(*) as count,
            COALESCE(SUM(amount), 0) as total_amount
        FROM incomes
        WHERE EXTRACT(YEAR FROM date) = $1
        GROUP BY month
    `, [year]);

    // Monthly Expense
    const monthlyExpenseRes = await db.query(`
        SELECT 
            EXTRACT(MONTH FROM issue_date) as month,
            COUNT(*) as count,
            COALESCE(SUM(net_amount), 0) as total_amount
        FROM expenses
        WHERE EXTRACT(YEAR FROM issue_date) = $1
        GROUP BY month
    `, [year]);

    // Expenses by Category
    const expensesByCategoryRes = await db.query(`
        SELECT 
            e.account_code,
            ec.title as category_name,
            COUNT(*) as count,
            COALESCE(SUM(e.net_amount), 0) as total_amount
        FROM expenses e
        LEFT JOIN account_codes ec ON e.account_code = ec.code
        WHERE EXTRACT(YEAR FROM e.issue_date) = $1
        GROUP BY e.account_code, ec.title
        ORDER BY total_amount DESC
    `, [year]);

    // Build monthly data
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
        const incomeRow = monthlyIncomeRes.rows.find(r => parseInt(r.month) === m);
        const expenseRow = monthlyExpenseRes.rows.find(r => parseInt(r.month) === m);

        const income = incomeRow ? parseFloat(incomeRow.total_amount) : 0;
        const expense = expenseRow ? parseFloat(expenseRow.total_amount) : 0;

        monthlyData.push({
            month: m,
            monthName: monthsFull[m - 1],
            monthKey: `${year}-${String(m).padStart(2, '0')}`,
            income: income,
            incomeCount: incomeRow ? parseInt(incomeRow.count) : 0,
            expense: expense,
            expenseCount: expenseRow ? parseInt(expenseRow.count) : 0,
            profit: income - expense,
            hasData: (income > 0 || expense > 0)
        });
    }

    const expensesByCategory = expensesByCategoryRes.rows.map(r => ({
        expenseCode: r.account_code,
        title: r.category_name || r.account_code,
        count: parseInt(r.count),
        totalAmount: parseFloat(r.total_amount)
    }));

    return {
        monthlyData,
        expensesByCategory
    };
};

module.exports = {
    getAvailableYears,
    getReportSummary
};
