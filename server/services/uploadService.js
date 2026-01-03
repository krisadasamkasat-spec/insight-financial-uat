const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Ensure upload directories exist
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Configure storage for member documents
const memberStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const memberId = req.params.memberId;
        const dir = path.join(__dirname, '..', 'uploads', 'members', memberId.toString());
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const docType = req.body.doc_type || 'document';
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now();
        cb(null, `${docType}_${uniqueSuffix}${ext}`);
    }
});

// Configure storage for expense attachments
const expenseStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const expenseId = req.params.expenseId;
        const dir = path.join(__dirname, '..', 'uploads', 'expenses', expenseId.toString());
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now();
        cb(null, `attachment_${uniqueSuffix}${ext}`);
    }
});

// File filter - allow common document types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: images, PDF, Word, Excel'), false);
    }
};

const uploadMemberDoc = multer({
    storage: memberStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadExpenseAttachment = multer({
    storage: expenseStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ========================
// MEMBER DOCUMENTS
// ========================

const getMemberDocuments = async (memberId) => {
    const result = await db.query(
        'SELECT * FROM member_documents WHERE member_id = $1 AND is_active = TRUE ORDER BY uploaded_at DESC',
        [memberId]
    );
    return result.rows;
};

const createMemberDocument = async (memberId, docType, fileName, filePath) => {
    const result = await db.query(
        `INSERT INTO member_documents (member_id, doc_type, file_name, file_path)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [memberId, docType, fileName, filePath]
    );
    return result.rows[0];
};

const deleteMemberDocument = async (docId) => {
    // Soft delete
    const result = await db.query(
        'UPDATE member_documents SET is_active = FALSE WHERE id = $1 RETURNING *',
        [docId]
    );
    return result.rows[0];
};

// ========================
// EXPENSE ATTACHMENTS
// ========================

const getExpenseAttachments = async (expenseId) => {
    const result = await db.query(
        `SELECT ea.*, md.doc_type AS member_doc_type
         FROM expense_attachments ea
         LEFT JOIN member_documents md ON ea.member_doc_id = md.id
         WHERE ea.expense_id = $1
         ORDER BY ea.uploaded_at DESC`,
        [expenseId]
    );
    return result.rows;
};

const createExpenseAttachment = async (expenseId, fileName, filePath, source = 'upload', memberDocId = null) => {
    const result = await db.query(
        `INSERT INTO expense_attachments (expense_id, file_name, file_path, source, member_doc_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [expenseId, fileName, filePath, source, memberDocId]
    );
    return result.rows[0];
};

const linkMemberDocToExpense = async (expenseId, memberDocId) => {
    // Get the member document info
    const docResult = await db.query('SELECT * FROM member_documents WHERE id = $1', [memberDocId]);
    if (docResult.rows.length === 0) throw new Error('Member document not found');

    const doc = docResult.rows[0];
    return createExpenseAttachment(expenseId, doc.file_name, doc.file_path, 'member', memberDocId);
};

const deleteExpenseAttachment = async (attachmentId) => {
    const result = await db.query(
        'DELETE FROM expense_attachments WHERE id = $1 RETURNING *',
        [attachmentId]
    );
    return result.rows[0];
};

module.exports = {
    uploadMemberDoc,
    uploadExpenseAttachment,
    getMemberDocuments,
    createMemberDocument,
    deleteMemberDocument,
    getExpenseAttachments,
    createExpenseAttachment,
    linkMemberDocToExpense,
    deleteExpenseAttachment
};
