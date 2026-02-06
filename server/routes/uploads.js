const express = require('express');
const router = express.Router();
const uploadService = require('../services/uploadService');

// ========================
// MEMBER DOCUMENTS
// ========================

// GET /api/uploads/members/:memberId/documents
router.get('/members/:memberId/documents', async (req, res) => {
    try {
        const docs = await uploadService.getMemberDocuments(req.params.memberId);
        res.json(docs);
    } catch (err) {
        console.error('Error fetching member documents:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/uploads/members/:memberId/documents
router.post('/members/:memberId/documents',
    uploadService.uploadMemberDoc.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { doc_type } = req.body;

            // Upload to Local Storage and save to database
            const doc = await uploadService.uploadMemberDocToLocal(
                req.params.memberId,
                req.file,
                doc_type || 'other'
            );

            res.status(201).json(doc);
        } catch (err) {
            console.error('Error uploading member document:', err);
            res.status(500).json({ error: err.message });
        }
    }
);

// DELETE /api/uploads/documents/:docId
router.delete('/documents/:docId', async (req, res) => {
    try {
        const doc = await uploadService.deleteMemberDocument(req.params.docId);
        res.json(doc);
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================
// EXPENSE ATTACHMENTS
// ========================

// GET /api/uploads/expenses/:expenseId/attachments
router.get('/expenses/:expenseId/attachments', async (req, res) => {
    try {
        const attachments = await uploadService.getExpenseAttachments(req.params.expenseId);
        res.json(attachments);
    } catch (err) {
        console.error('Error fetching expense attachments:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/uploads/expenses/:expenseId/attachments (Upload new file)
router.post('/expenses/:expenseId/attachments',
    uploadService.uploadExpenseAttachment.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Upload to Local Storage and save to database
            const attachment = await uploadService.uploadExpenseAttachmentToLocal(
                req.params.expenseId,
                req.file
            );

            res.status(201).json(attachment);
        } catch (err) {
            console.error('Error uploading expense attachment:', err);
            res.status(500).json({ error: err.message });
        }
    }
);

// POST /api/uploads/expenses/:expenseId/link-member-doc (Link existing member doc)
router.post('/expenses/:expenseId/link-member-doc', async (req, res) => {
    try {
        const { member_doc_id } = req.body;
        if (!member_doc_id) {
            return res.status(400).json({ error: 'member_doc_id is required' });
        }

        const attachment = await uploadService.linkMemberDocToExpense(
            req.params.expenseId,
            member_doc_id
        );

        res.status(201).json(attachment);
    } catch (err) {
        console.error('Error linking member document:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/uploads/attachments/:attachmentId
router.delete('/attachments/:attachmentId', async (req, res) => {
    try {
        const attachment = await uploadService.deleteExpenseAttachment(req.params.attachmentId);
        res.json(attachment);
    } catch (err) {
        console.error('Error deleting attachment:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
