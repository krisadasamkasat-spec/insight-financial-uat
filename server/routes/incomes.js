const express = require('express');
const router = express.Router();
const incomeService = require('../services/incomeService');

// GET all incomes
router.get('/', async (req, res) => {
    try {
        const incomes = await incomeService.getAllIncomes();
        res.json(incomes);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET incomes by project
router.get('/project/:project_code', async (req, res) => {
    try {
        const { project_code } = req.params;
        const incomes = await incomeService.getIncomesByProject(project_code);
        res.json(incomes);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST new income
router.post('/', async (req, res) => {
    try {
        const newIncome = await incomeService.createIncome(req.body);
        res.status(201).json(newIncome);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to create income' });
    }
});

// PUT update income
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedIncome = await incomeService.updateIncome(id, req.body);

        if (!updatedIncome) {
            return res.status(404).json({ error: 'Income not found' });
        }

        res.json(updatedIncome);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to update income' });
    }
});

// DELETE income
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await incomeService.deleteIncome(id);

        if (!success) {
            return res.status(404).json({ error: 'Income not found' });
        }

        res.json({ message: 'Income deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
