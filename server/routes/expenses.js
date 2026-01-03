const express = require('express');
const router = express.Router();
const expenseService = require('../services/expenseService');

// GET all account codes (renamed from expense_codes)
router.get('/codes', async (req, res) => {
    try {
        const codes = await expenseService.getAllAccountCodes();
        res.json(codes);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Alias for new naming convention
router.get('/account-codes', async (req, res) => {
    try {
        const codes = await expenseService.getAllAccountCodes();
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

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/expenses/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB
});

// POST upload attachments for an expense
router.post('/:id/attachments', upload.array('files', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const attachments = [];
        for (const file of files) {
            const attachment = await expenseService.addAttachment({
                expense_id: id,
                file_name: file.originalname,
                file_path: file.path.replace(/\\/g, '/'), // Normalize path for Windows
                source: 'upload'
            });
            attachments.push(attachment);
        }

        res.status(201).json(attachments);
    } catch (err) {
        console.error('Error uploading files:', err.message);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

// DELETE attachment
router.delete('/attachments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await expenseService.deleteAttachment(id);
        if (!result) return res.status(404).json({ error: 'Attachment not found' });
        res.json({ message: 'Attachment deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
