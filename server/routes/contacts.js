const express = require('express');
const router = express.Router();
const contactService = require('../services/contactService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/contacts');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${req.params.id}_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and images are allowed.'));
        }
    }
});

// GET /api/contacts - Get all contacts with optional search
router.get('/', async (req, res) => {
    try {
        const { search, entityType } = req.query;
        const contacts = await contactService.getAllContacts(search, entityType);
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/contacts/:id - Get single contact with documents
router.get('/:id', async (req, res) => {
    try {
        const contact = await contactService.getContactById(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/contacts - Create new contact
router.post('/', async (req, res) => {
    try {
        const contact = await contactService.createContact(req.body);
        res.status(201).json(contact);
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', async (req, res) => {
    try {
        const contact = await contactService.updateContact(req.params.id, req.body);
        res.json(contact);
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/contacts/:id - Soft delete contact
router.delete('/:id', async (req, res) => {
    try {
        const result = await contactService.deleteContact(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET /api/contacts/:id/documents - Get documents for contact
router.get('/:id/documents', async (req, res) => {
    try {
        const documents = await contactService.getDocuments(req.params.id);
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/contacts/:id/documents - Upload document
router.post('/:id/documents', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const documentData = {
            document_type: req.body.document_type || 'other',
            file_name: req.file.originalname,
            file_path: `/uploads/contacts/${req.file.filename}`,
            file_size: req.file.size,
            file_ext: path.extname(req.file.originalname).replace('.', '')
        };

        const document = await contactService.addDocument(req.params.id, documentData);
        res.status(201).json(document);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/contacts/:id/documents/:docId - Remove document
router.delete('/:id/documents/:docId', async (req, res) => {
    try {
        const result = await contactService.removeDocument(req.params.id, req.params.docId);
        res.json(result);
    } catch (error) {
        console.error('Error removing document:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
