const express = require('express');
const router = express.Router();
const accountService = require('../services/accountService');

// GET all accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await accountService.getAllAccounts();
        res.json(accounts);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET account by id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const account = await accountService.getAccountById(id);

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(account);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST new account
router.post('/', async (req, res) => {
    try {
        const newAccount = await accountService.createAccount(req.body);
        res.status(201).json(newAccount);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// PUT update account
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAccount = await accountService.updateAccount(id, req.body);

        if (!updatedAccount) {
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json(updatedAccount);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// DELETE account (Soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await accountService.deleteAccount(id);

        if (!success) {
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET account transactions
router.get('/:id/transactions', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = req.query.limit || 20;
        const transactions = await accountService.getAccountTransactions(id, limit);
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

module.exports = router;
