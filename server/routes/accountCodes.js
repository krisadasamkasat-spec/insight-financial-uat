const express = require('express');
const router = express.Router();
const accountCodeService = require('../services/accountCodeService');

// GET all account codes
router.get('/', async (req, res) => {
    try {
        const codes = await accountCodeService.getAllAccountCodes();
        res.json(codes);
    } catch (err) {
        console.error('Error fetching account codes:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET single account code
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const accountCode = await accountCodeService.getAccountCodeByCode(code);

        if (!accountCode) {
            return res.status(404).json({ error: 'Account code not found' });
        }
        res.json(accountCode);
    } catch (err) {
        console.error('Error fetching account code:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST new account code
router.post('/', async (req, res) => {
    try {
        const newCode = await accountCodeService.createAccountCode(req.body);
        res.status(201).json(newCode);
    } catch (err) {
        console.error('Error creating account code:', err.message);
        res.status(500).json({ error: 'Failed to create account code' });
    }
});

// PUT update account code
router.put('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const updated = await accountCodeService.updateAccountCode(code, req.body);

        if (!updated) {
            return res.status(404).json({ error: 'Account code not found' });
        }
        res.json(updated);
    } catch (err) {
        console.error('Error updating account code:', err.message);
        res.status(500).json({ error: 'Failed to update account code' });
    }
});

// DELETE account code
router.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const success = await accountCodeService.deleteAccountCode(code);

        if (!success) {
            return res.status(404).json({ error: 'Account code not found' });
        }
        res.json({ message: 'Account code deleted successfully' });
    } catch (err) {
        console.error('Error deleting account code:', err.message);
        res.status(500).json({ error: 'Failed to delete account code' });
    }
});

module.exports = router;
