const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const membersDir = path.join(uploadDir, 'members');
const expensesDir = path.join(uploadDir, 'expenses');

[uploadDir, membersDir, expensesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure Multer Disk Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = uploadDir;
        if (req.originalUrl.includes('members')) {
            dest = membersDir;
        } else if (req.originalUrl.includes('expenses')) {
            dest = expensesDir;
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        // Safe filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, name + '-' + uniqueSuffix + ext);
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

// Multer instances
const uploadMemberDoc = multer({
    storage: storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadExpenseAttachment = multer({
    storage: storage,
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

/**
 * Upload a member document to Local Storage and save to database
 */
const uploadMemberDocToLocal = async (memberId, file, docType) => {
    // Construct public URL (relative path from server root or full URL if preferred)
    // Assuming we serve uploads from /uploads route
    // The file.path is the absolute path on disk, we need the web-accessible path
    // Multer's file.filename gives us the saved name.

    // We can restructure to subfolders per ID if needed, 
    // but for simplicity with the single configured storage above, we are dumping into `membersDir`.

    const webPath = `/uploads/members/${file.filename}`;

    return await createMemberDocument(
        memberId,
        docType,
        file.originalname,
        webPath
    );
};

const deleteMemberDocument = async (docId) => {
    // Get the document to find its path
    const docResult = await db.query('SELECT * FROM member_documents WHERE id = $1', [docId]);
    if (docResult.rows.length > 0) {
        const doc = docResult.rows[0];

        // Extract filename from web path to delete from disk
        // path: /uploads/members/filename.ext
        const filename = path.basename(doc.file_path);
        const filePath = path.join(membersDir, filename);

        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error(`Failed to delete local file: ${filePath}`, err);
            }
        }
    }

    // Soft delete in database
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

/**
 * Upload an expense attachment to Local Storage and save to database
 */
const uploadExpenseAttachmentToLocal = async (expenseId, file) => {
    const webPath = `/uploads/expenses/${file.filename}`;

    return await createExpenseAttachment(
        expenseId,
        file.originalname,
        webPath,
        'upload'
    );
};

const linkMemberDocToExpense = async (expenseId, memberDocId) => {
    // Get the member document info
    const docResult = await db.query('SELECT * FROM member_documents WHERE id = $1', [memberDocId]);
    if (docResult.rows.length === 0) throw new Error('Member document not found');

    const doc = docResult.rows[0];
    return createExpenseAttachment(expenseId, doc.file_name, doc.file_path, 'member', memberDocId);
};

const deleteExpenseAttachment = async (attachmentId) => {
    // Get the attachment to find its path
    const attachResult = await db.query('SELECT * FROM expense_attachments WHERE id = $1', [attachmentId]);
    if (attachResult.rows.length > 0) {
        const attachment = attachResult.rows[0];
        // Only delete from disk if it's an uploaded file (not linked from member docs)
        if (attachment.source === 'upload') {
            const filename = path.basename(attachment.file_path);
            const filePath = path.join(expensesDir, filename);

            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error(`Failed to delete local file: ${filePath}`, err);
                }
            }
        }
    }

    // Delete from database
    const result = await db.query(
        'DELETE FROM expense_attachments WHERE id = $1 RETURNING *',
        [attachmentId]
    );
    return result.rows[0];
};

module.exports = {
    // Multer middleware
    uploadMemberDoc,
    uploadExpenseAttachment,

    // Database functions
    getMemberDocuments,
    createMemberDocument,
    deleteMemberDocument,
    getExpenseAttachments,
    createExpenseAttachment,
    linkMemberDocToExpense,
    deleteExpenseAttachment,

    // New Local functions (replacing Cloudinary ones)
    uploadMemberDocToLocal,
    uploadExpenseAttachmentToLocal,

    // Alias old names to new functions for compatibility if I miss updating a route
    uploadMemberDocToCloudinary: uploadMemberDocToLocal,
    uploadExpenseAttachmentToCloudinary: uploadExpenseAttachmentToLocal
};
