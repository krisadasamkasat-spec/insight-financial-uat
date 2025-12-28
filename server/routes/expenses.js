const express = require('express');
const router = express.Router();
const expenseService = require('../services/expenseService');

// GET all expense codes
router.get('/codes', async (req, res) => {
    try {
        const codes = await expenseService.getAllExpenseCodes();
        res.json(codes);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET all expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await expenseService.getAllExpenses();
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET expenses by project
router.get('/project/:project_code', async (req, res) => {
    try {
        const { project_code } = req.params;
        const expenses = await expenseService.getExpensesByProject(project_code);
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST new expense
router.post('/', async (req, res) => {
    try {
        const newExpense = await expenseService.createExpense(req.body);
        res.status(201).json(newExpense);
    } catch (err) {
        console.error('Error creating expense:', err.message, err.detail, err.code);
        console.error('Request Body:', req.body);
        res.status(500).json({ error: 'Failed to create expense', details: err.message });
    }
});

// PUT update expense status (workflow)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedExpense = await expenseService.updateExpenseStatus(id, req.body);

        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json(updatedExpense);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to update expense status' });
    }
});

// PUT update expense (full update)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedExpense = await expenseService.updateExpense(id, req.body);

        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json(updatedExpense);
    } catch (err) {
        console.error('Error updating expense:', err.message);
        res.status(500).json({ error: 'Failed to update expense', details: err.message });
    }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await expenseService.deleteExpense(id);

        if (!success) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
